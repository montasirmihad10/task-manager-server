import HttpStatus from "http-status";
import { Types } from "mongoose";
import AppError from "../../erros/AppError";
import {
  ACTIVITY_ACTION,
  MEMBERSHIP_STATUS,
  TWorkspaceRole,
  WORKSPACE_ROLE,
} from "../../constants/workspace";
import { UserModel } from "../User/user.model";
import { activityServices } from "../Activity/activity.service";
import { sendNotification } from "../Notification/notification.utils";
import { WorkspaceModel } from "./workspace.model";
import { WorkspaceMemberModel } from "./workspaceMember.model";

const slugify = (name: string) =>
  name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48) || "workspace";

const uniqueSlug = async (base: string) => {
  let slug = slugify(base);
  let i = 0;
  while (await WorkspaceModel.exists({ slug })) {
    i += 1;
    slug = `${slugify(base)}-${i}`;
  }
  return slug;
};

type BootstrapOpts = {
  intent?: "manager" | "member";
};

/**
 * Bootstrap first workspace for a user.
 * - manager → team workspace (owner/admin membership, invites allowed)
 * - member (solo) → personal workspace (owner for own board; no team invites)
 */
const ensureDefaultWorkspace = async (
  userId: string | Types.ObjectId,
  opts?: BootstrapOpts,
) => {
  const existing = await WorkspaceMemberModel.findOne({
    userId,
    status: MEMBERSHIP_STATUS.active,
  }).populate("workspaceId");

  if (existing) return existing;

  const user = await UserModel.findById(userId).select(
    "name email signupIntent canManageTeam",
  );
  if (!user) {
    throw new AppError(HttpStatus.NOT_FOUND, "User not found");
  }

  const intent =
    opts?.intent ||
    (user.signupIntent as "manager" | "member" | undefined) ||
    "member";
  const isManager = intent === "manager" || user.canManageTeam === true;

  const baseName = user.name || user.email.split("@")[0];
  const name = isManager
    ? `${baseName}'s Team`
    : `${baseName}'s Workspace`;

  const workspace = await WorkspaceModel.create({
    name,
    slug: await uniqueSlug(
      isManager
        ? `team-${user.email.split("@")[0]}`
        : `ws-${user.email.split("@")[0]}`,
    ),
    description: isManager
      ? "Team workspace — invite members and assign work"
      : "Personal workspace — work for yourself",
    ownerId: userId,
    isPersonal: !isManager,
  });

  // Owner keeps DB role `admin` (settings + board). Product UI labels this Manager / You.
  const membership = await WorkspaceMemberModel.create({
    workspaceId: workspace._id,
    userId,
    role: WORKSPACE_ROLE.admin,
    status: MEMBERSHIP_STATUS.active,
    joinedAt: new Date(),
  });

  try {
    const { workspaceStatusServices } = await import(
      "../WorkspaceStatus/workspaceStatus.service"
    );
    await workspaceStatusServices.seedDefaultStatuses(String(workspace._id));
  } catch {
    // non-blocking
  }

  return membership;
};

const assertCanManageTeam = async (userId: string) => {
  const user = await UserModel.findById(userId).select(
    "canManageTeam signupIntent role",
  );
  if (!user) {
    throw new AppError(HttpStatus.NOT_FOUND, "User not found");
  }
  if (user.role === "admin" || user.role === "super_admin") return;
  if (user.canManageTeam) return;
  if (user.signupIntent === "manager") return;
  throw new AppError(
    HttpStatus.FORBIDDEN,
    "Solo member accounts cannot create team workspaces. Sign up as a manager to lead a team.",
  );
};

const createWorkspace = async (
  userId: string,
  payload: { name: string; description?: string },
) => {
  await assertCanManageTeam(userId);

  const workspace = await WorkspaceModel.create({
    name: payload.name,
    slug: await uniqueSlug(payload.name),
    description: payload.description || "",
    ownerId: userId,
    isPersonal: false,
  });

  await WorkspaceMemberModel.create({
    workspaceId: workspace._id,
    userId,
    role: WORKSPACE_ROLE.admin,
    status: MEMBERSHIP_STATUS.active,
    joinedAt: new Date(),
  });

  try {
    const { workspaceStatusServices } = await import(
      "../WorkspaceStatus/workspaceStatus.service"
    );
    await workspaceStatusServices.seedDefaultStatuses(String(workspace._id));
  } catch {
    // non-blocking
  }

  return workspace;
};

/** Personal/solo workspaces cannot invite; team workspaces can (manager+) */
const assertWorkspaceAllowsInvites = async (workspaceId: string) => {
  const workspace = await WorkspaceModel.findOne({
    _id: workspaceId,
    isDeleted: false,
  });
  if (!workspace) {
    throw new AppError(HttpStatus.NOT_FOUND, "Workspace not found");
  }
  if (workspace.isPersonal) {
    throw new AppError(
      HttpStatus.FORBIDDEN,
      "Personal workspaces are solo. Create a team workspace as a manager to invite people.",
    );
  }
  return workspace;
};

const sortWorkspaces = <T extends { isPersonal?: boolean; name?: string }>(
  list: T[],
) =>
  [...list].sort((a, b) => {
    // Team workspaces first so overview/charts open on populated boards
    if (Boolean(a.isPersonal) !== Boolean(b.isPersonal)) {
      return a.isPersonal ? 1 : -1;
    }
    return String(a.name || "").localeCompare(String(b.name || ""));
  });

const listMyWorkspaces = async (userId: string) => {
  const user = await UserModel.findById(userId).select("role");
  const isPlatformAdmin =
    user?.role === "admin" || user?.role === "super_admin";

  // Platform admins see every workspace; product users only their memberships
  if (isPlatformAdmin) {
    const all = await WorkspaceModel.find({ isDeleted: false }).lean();
    return sortWorkspaces(
      all.map((w) => ({
        ...w,
        membershipRole: WORKSPACE_ROLE.admin,
        membershipId: `platform:${String(w._id)}`,
        isPlatformVisible: true,
      })),
    );
  }

  const memberships = await WorkspaceMemberModel.find({
    userId,
    status: MEMBERSHIP_STATUS.active,
  })
    .populate({
      path: "workspaceId",
      match: { isDeleted: false },
    })
    .lean();

  const mapped = memberships
    .filter((m) => m.workspaceId)
    .map((m) => {
      const ws = m.workspaceId as unknown as {
        isPersonal?: boolean;
        name?: string;
        [key: string]: unknown;
      };
      return {
        ...ws,
        membershipRole: m.role,
        membershipId: m._id,
      };
    });

  return sortWorkspaces(mapped);
};

const getWorkspaceById = async (workspaceId: string, userId: string) => {
  const membership = await WorkspaceMemberModel.findOne({
    workspaceId,
    userId,
    status: MEMBERSHIP_STATUS.active,
  });

  if (!membership) {
    throw new AppError(HttpStatus.FORBIDDEN, "Not a workspace member");
  }

  const workspace = await WorkspaceModel.findOne({
    _id: workspaceId,
    isDeleted: false,
  });

  if (!workspace) {
    throw new AppError(HttpStatus.NOT_FOUND, "Workspace not found");
  }

  return { workspace, membership };
};

const updateWorkspace = async (
  workspaceId: string,
  payload: { name?: string; description?: string },
) => {
  const workspace = await WorkspaceModel.findOneAndUpdate(
    { _id: workspaceId, isDeleted: false },
    { $set: payload },
    { returnDocument: 'after' },
  );

  if (!workspace) {
    throw new AppError(HttpStatus.NOT_FOUND, "Workspace not found");
  }

  return workspace;
};

const softDeleteWorkspace = async (workspaceId: string, userId: string) => {
  const workspace = await WorkspaceModel.findOne({
    _id: workspaceId,
    isDeleted: false,
  });

  if (!workspace) {
    throw new AppError(HttpStatus.NOT_FOUND, "Workspace not found");
  }

  if (String(workspace.ownerId) !== String(userId)) {
    throw new AppError(
      HttpStatus.FORBIDDEN,
      "Only the workspace owner can delete it",
    );
  }

  workspace.isDeleted = true;
  await workspace.save();
  return workspace;
};

const listMembers = async (workspaceId: string) => {
  return WorkspaceMemberModel.find({
    workspaceId,
    status: { $ne: MEMBERSHIP_STATUS.removed },
  })
    .populate("userId", "name email profileImage role")
    .populate("invitedBy", "name email")
    .sort({ createdAt: 1 })
    .lean();
};

const inviteMember = async (
  workspaceId: string,
  inviterId: string,
  payload: { email: string; role?: TWorkspaceRole },
) => {
  await assertWorkspaceAllowsInvites(workspaceId);

  const email = payload.email.toLowerCase().trim();
  // Managers invite members (or other managers). Never invite as admin/owner.
  const role = (payload.role || WORKSPACE_ROLE.member) as TWorkspaceRole;

  if (role === WORKSPACE_ROLE.admin) {
    throw new AppError(
      HttpStatus.BAD_REQUEST,
      "Cannot invite as admin; the workspace owner stays the manager who created it",
    );
  }

  const user = await UserModel.findOne({
    email,
    isDeleted: false,
    isVerified: true,
  });

  if (!user) {
    throw new AppError(
      HttpStatus.NOT_FOUND,
      "No verified user found with that email. They must register first.",
    );
  }

  if (String(user._id) === String(inviterId)) {
    throw new AppError(HttpStatus.BAD_REQUEST, "Cannot invite yourself");
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
    existing.invitedBy = new Types.ObjectId(inviterId);
    existing.joinedAt = new Date();
    membership = await existing.save();
  } else {
    membership = await WorkspaceMemberModel.create({
      workspaceId,
      userId: user._id,
      role,
      status: MEMBERSHIP_STATUS.active,
      invitedBy: inviterId,
      joinedAt: new Date(),
    });
  }

  await activityServices.logActivity({
    workspaceId,
    actorId: inviterId,
    action: ACTIVITY_ACTION.member_invited,
    meta: { userId: String(user._id), role, email },
  });

  try {
    await sendNotification({
      recipientId: user._id,
      senderId: inviterId,
      type: "workspace_invite",
      title: "Workspace invitation",
      message: `You were added to a workspace as ${role}`,
      data: { workspaceId, role },
    });
  } catch {
    // non-blocking
  }

  return membership.populate("userId", "name email profileImage");
};

const updateMemberRole = async (
  workspaceId: string,
  memberId: string,
  role: TWorkspaceRole,
  actorId: string,
) => {
  const membership = await WorkspaceMemberModel.findOne({
    _id: memberId,
    workspaceId,
    status: MEMBERSHIP_STATUS.active,
  });

  if (!membership) {
    throw new AppError(HttpStatus.NOT_FOUND, "Membership not found");
  }

  const workspace = await WorkspaceModel.findById(workspaceId);
  if (workspace && String(workspace.ownerId) === String(membership.userId)) {
    throw new AppError(
      HttpStatus.BAD_REQUEST,
      "Cannot change the workspace owner's role",
    );
  }

  membership.role = role;
  await membership.save();

  await activityServices.logActivity({
    workspaceId,
    actorId,
    action: ACTIVITY_ACTION.member_role_changed,
    meta: { membershipId: memberId, role },
  });

  return membership;
};

const removeMember = async (
  workspaceId: string,
  memberId: string,
  actorId: string,
) => {
  const membership = await WorkspaceMemberModel.findOne({
    _id: memberId,
    workspaceId,
  });

  if (!membership) {
    throw new AppError(HttpStatus.NOT_FOUND, "Membership not found");
  }

  const workspace = await WorkspaceModel.findById(workspaceId);
  if (workspace && String(workspace.ownerId) === String(membership.userId)) {
    throw new AppError(
      HttpStatus.BAD_REQUEST,
      "Cannot remove the workspace owner",
    );
  }

  membership.status = MEMBERSHIP_STATUS.removed;
  await membership.save();

  await activityServices.logActivity({
    workspaceId,
    actorId,
    action: ACTIVITY_ACTION.member_role_changed,
    meta: { membershipId: memberId, status: "removed" },
  });

  return membership;
};

export const workspaceServices = {
  ensureDefaultWorkspace,
  createWorkspace,
  assertCanManageTeam,
  assertWorkspaceAllowsInvites,
  listMyWorkspaces,
  getWorkspaceById,
  updateWorkspace,
  softDeleteWorkspace,
  listMembers,
  inviteMember,
  updateMemberRole,
  removeMember,
};
