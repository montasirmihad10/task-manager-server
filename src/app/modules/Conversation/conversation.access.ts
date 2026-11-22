import HttpStatus from "http-status";
import { Types } from "mongoose";
import AppError from "../../erros/AppError";
import {
  MEMBERSHIP_STATUS,
  WORKSPACE_ROLE,
  type TWorkspaceRole,
} from "../../constants/workspace";
import { WorkspaceMemberModel } from "../Workspace/workspaceMember.model";
import type { IConversation, TAnnouncementKind } from "./conversation.interface";

export const getActiveMembership = async (
  workspaceId: Types.ObjectId | string,
  userId: Types.ObjectId | string,
) => {
  return WorkspaceMemberModel.findOne({
    workspaceId,
    userId,
    status: MEMBERSHIP_STATUS.active,
  });
};

export const listActiveMemberUserIds = async (
  workspaceId: Types.ObjectId | string,
  roles: TWorkspaceRole[],
) => {
  const rows = await WorkspaceMemberModel.find({
    workspaceId,
    status: MEMBERSHIP_STATUS.active,
    role: { $in: roles },
  }).select("userId");
  return rows.map((r) => new Types.ObjectId(String(r.userId)));
};

export const announcementAudienceRoles = (
  kind: TAnnouncementKind,
): TWorkspaceRole[] => {
  if (kind === "admin_managers") {
    return [WORKSPACE_ROLE.admin, WORKSPACE_ROLE.manager];
  }
  return [WORKSPACE_ROLE.admin, WORKSPACE_ROLE.member];
};

export const canAccessConversation = async (
  conversation: IConversation,
  userId: Types.ObjectId,
) => {
  if (conversation.type === "direct" || !conversation.type) {
    return conversation.participants.some((p) => {
      const id = (p as { _id?: Types.ObjectId })?._id || (p as Types.ObjectId);
      return id
        ? new Types.ObjectId(id.toString()).equals(userId)
        : false;
    });
  }

  if (!conversation.workspaceId || !conversation.announcementKind) {
    return false;
  }

  const membership = await getActiveMembership(
    conversation.workspaceId,
    userId,
  );
  if (!membership) return false;

  const allowed = announcementAudienceRoles(conversation.announcementKind);
  return allowed.includes(membership.role as TWorkspaceRole);
};

export const canPostInConversation = async (
  conversation: IConversation,
  userId: Types.ObjectId,
) => {
  const canAccess = await canAccessConversation(conversation, userId);
  if (!canAccess) return false;

  if (conversation.type === "announcement" || conversation.adminOnlyPost) {
    if (!conversation.workspaceId) return false;
    const membership = await getActiveMembership(
      conversation.workspaceId,
      userId,
    );
    return membership?.role === WORKSPACE_ROLE.admin;
  }

  return true;
};

export const assertCanAccess = async (
  conversation: IConversation,
  userId: Types.ObjectId,
) => {
  if (!(await canAccessConversation(conversation, userId))) {
    throw new AppError(
      HttpStatus.FORBIDDEN,
      "You are not part of this conversation",
    );
  }
};

export const assertCanPost = async (
  conversation: IConversation,
  userId: Types.ObjectId,
) => {
  await assertCanAccess(conversation, userId);
  if (!(await canPostInConversation(conversation, userId))) {
    throw new AppError(
      HttpStatus.FORBIDDEN,
      "Only workspace admins can post in announcement channels",
    );
  }
};

/** Manager↔member (and admin with either) within the same workspace */
export const assertDirectChatAllowed = async (
  workspaceId: string,
  actorId: Types.ObjectId,
  recipientId: Types.ObjectId,
) => {
  const [actor, recipient] = await Promise.all([
    getActiveMembership(workspaceId, actorId),
    getActiveMembership(workspaceId, recipientId),
  ]);

  if (!actor || !recipient) {
    throw new AppError(
      HttpStatus.FORBIDDEN,
      "Both people must be active members of this workspace",
    );
  }

  const a = actor.role as TWorkspaceRole;
  const b = recipient.role as TWorkspaceRole;

  const ok =
    a === WORKSPACE_ROLE.admin ||
    b === WORKSPACE_ROLE.admin ||
    (a === WORKSPACE_ROLE.manager && b === WORKSPACE_ROLE.member) ||
    (a === WORKSPACE_ROLE.member && b === WORKSPACE_ROLE.manager);

  if (!ok) {
    throw new AppError(
      HttpStatus.FORBIDDEN,
      "Direct chat is for manager↔member (or with a workspace admin)",
    );
  }
};
