import crypto from "crypto";
import HttpStatus from "http-status";
import { Types } from "mongoose";
import AppError from "../../erros/AppError";
import { PRODUCT } from "../../constants/product";
import {
  ACTIVITY_ACTION,
  MEMBERSHIP_STATUS,
} from "../../constants/workspace";
import type { TInviteRole } from "./invite.model";
import config from "../../config";
import { sendEmail } from "../../utils/sendEmail";
import { UserModel } from "../User/user.model";
import { WorkspaceModel } from "../Workspace/workspace.model";
import { WorkspaceMemberModel } from "../Workspace/workspaceMember.model";
import { activityServices } from "../Activity/activity.service";
import { WorkspaceInviteModel } from "./invite.model";

const createInviteLink = async (
  workspaceId: string,
  invitedBy: string,
  payload: { email: string; role?: TInviteRole },
) => {
  const email = payload.email.toLowerCase().trim();
  const role: TInviteRole = payload.role === "manager" ? "manager" : "member";

  const { workspaceServices } = await import("../Workspace/workspace.service");
  const workspace =
    await workspaceServices.assertWorkspaceAllowsInvites(workspaceId);

  const token = crypto.randomBytes(24).toString("hex");
  const expiresAt = new Date(
    Date.now() + PRODUCT.INVITE_EXPIRES_DAYS * 24 * 60 * 60 * 1000,
  );

  const invite = await WorkspaceInviteModel.create({
    workspaceId,
    email,
    role,
    token,
    invitedBy,
    expiresAt,
  });

  const base =
    config.LOCAL_URL?.replace(/\/$/, "") || "http://localhost:3000";
  const inviteUrl = `${base}/invite/${token}`;

  try {
    await sendEmail(
      email,
      `You're invited to ${workspace.name}`,
      `<p>You've been invited to join <strong>${workspace.name}</strong> as <strong>${role}</strong>.</p>
       <p><a href="${inviteUrl}">Accept invite</a></p>
       <p>Or open: ${inviteUrl}</p>
       <p>This link expires in ${PRODUCT.INVITE_EXPIRES_DAYS} days.</p>`,
    );
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Invite email failed:", err);
  }

  await activityServices.logActivity({
    workspaceId,
    actorId: invitedBy,
    action: ACTIVITY_ACTION.member_invited,
    meta: { email, role, via: "invite_link" },
  });

  return { invite, inviteUrl };
};

const getInviteByToken = async (token: string) => {
  const invite = await WorkspaceInviteModel.findOne({ token }).populate(
    "workspaceId",
    "name slug",
  );
  if (!invite || invite.revokedAt) {
    throw new AppError(HttpStatus.NOT_FOUND, "Invite not found");
  }
  if (invite.acceptedAt) {
    throw new AppError(HttpStatus.BAD_REQUEST, "Invite already accepted");
  }
  if (invite.expiresAt.getTime() < Date.now()) {
    throw new AppError(HttpStatus.BAD_REQUEST, "Invite expired");
  }
  return invite;
};

const acceptInvite = async (token: string, userId: string) => {
  const invite = await getInviteByToken(token);
  const user = await UserModel.findById(userId);
  if (!user) throw new AppError(HttpStatus.NOT_FOUND, "User not found");

  if (user.email.toLowerCase() !== invite.email.toLowerCase()) {
    throw new AppError(
      HttpStatus.FORBIDDEN,
      "This invite was sent to a different email address",
    );
  }

  const existing = await WorkspaceMemberModel.findOne({
    workspaceId: invite.workspaceId,
    userId,
  });

  if (existing && existing.status !== MEMBERSHIP_STATUS.removed) {
    invite.acceptedAt = new Date();
    invite.acceptedBy = new Types.ObjectId(userId);
    await invite.save();
    return existing;
  }

  let membership;
  if (existing) {
    existing.role = invite.role;
    existing.status = MEMBERSHIP_STATUS.active;
    existing.invitedBy = invite.invitedBy;
    existing.joinedAt = new Date();
    membership = await existing.save();
  } else {
    membership = await WorkspaceMemberModel.create({
      workspaceId: invite.workspaceId,
      userId,
      role: invite.role,
      status: MEMBERSHIP_STATUS.active,
      invitedBy: invite.invitedBy,
      joinedAt: new Date(),
    });
  }

  invite.acceptedAt = new Date();
  invite.acceptedBy = new Types.ObjectId(userId);
  await invite.save();

  return membership;
};

const listInvites = async (workspaceId: string) =>
  WorkspaceInviteModel.find({
    workspaceId,
    revokedAt: null,
    acceptedAt: null,
  }).sort({ createdAt: -1 });

const revokeInvite = async (inviteId: string) => {
  const invite = await WorkspaceInviteModel.findById(inviteId);
  if (!invite) throw new AppError(HttpStatus.NOT_FOUND, "Invite not found");
  invite.revokedAt = new Date();
  await invite.save();
  return invite;
};

/**
 * Create (or reuse) a member account with a temporary password, add them to the
 * workspace, and email login credentials. They must change password on first login.
 */
const createWithCredentials = async (
  workspaceId: string,
  invitedBy: string,
  payload: { email: string; name?: string; role?: TInviteRole },
) => {
  const email = payload.email.toLowerCase().trim();
  const role: TInviteRole = payload.role === "manager" ? "manager" : "member";

  const { workspaceServices } = await import("../Workspace/workspace.service");
  const workspace =
    await workspaceServices.assertWorkspaceAllowsInvites(workspaceId);

  const tempPassword = crypto.randomBytes(4).toString("hex") + "Aa1!";

  let user = await UserModel.findOne({ email, isDeleted: false });
  let created = false;

  if (!user) {
    user = await UserModel.create({
      email,
      name: payload.name || email.split("@")[0],
      password: tempPassword,
      role: "user",
      signupIntent: "member",
      canManageTeam: false,
      mustChangePassword: true,
      isVerified: true,
    });
    created = true;
  } else {
    // Existing account: reset temp password and force change
    user.password = tempPassword;
    user.mustChangePassword = true;
    user.isVerified = true;
    await user.save();
  }

  const existing = await WorkspaceMemberModel.findOne({
    workspaceId,
    userId: user._id,
  });

  if (existing && existing.status !== MEMBERSHIP_STATUS.removed) {
    throw new AppError(HttpStatus.CONFLICT, "User is already a member");
  }

  let membership;
  if (existing) {
    existing.role = role;
    existing.status = MEMBERSHIP_STATUS.active;
    existing.invitedBy = new Types.ObjectId(invitedBy);
    existing.joinedAt = new Date();
    membership = await existing.save();
  } else {
    membership = await WorkspaceMemberModel.create({
      workspaceId,
      userId: user._id,
      role,
      status: MEMBERSHIP_STATUS.active,
      invitedBy,
      joinedAt: new Date(),
    });
  }

  const base =
    config.LOCAL_URL?.replace(/\/$/, "") || "http://localhost:3000";
  const loginUrl = `${base}/login`;

  try {
    await sendEmail(
      email,
      `Your ${workspace.name} login on Planboard`,
      `<p>You've been added to <strong>${workspace.name}</strong> as <strong>${role}</strong>.</p>
       <p>Sign in at <a href="${loginUrl}">${loginUrl}</a> with:</p>
       <ul>
         <li>Email: <strong>${email}</strong></li>
         <li>Temporary password: <strong>${tempPassword}</strong></li>
       </ul>
       <p>You will be asked to set a new password after logging in.</p>`,
    );
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Credentials invite email failed:", err);
  }

  await activityServices.logActivity({
    workspaceId,
    actorId: invitedBy,
    action: ACTIVITY_ACTION.member_invited,
    meta: { email, role, via: "credentials", created },
  });

  return {
    membership,
    email,
    temporaryPassword: tempPassword,
    created,
    loginUrl,
  };
};

export const inviteServices = {
  createInviteLink,
  createWithCredentials,
  getInviteByToken,
  acceptInvite,
  listInvites,
  revokeInvite,
};
