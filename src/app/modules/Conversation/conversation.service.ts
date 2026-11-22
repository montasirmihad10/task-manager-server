import HttpStatus from "http-status";
import { Types } from "mongoose";
import { JwtPayload } from "../../interface/global";
import { ConversationModel } from "./conversation.model";
import { UserModel } from "../User/user.model";
import AppError from "../../erros/AppError";
import QueryBuilder from "../../../builder/QueryBuilder";
import {
  assertCanAccess,
  assertDirectChatAllowed,
  announcementAudienceRoles,
  getActiveMembership,
  listActiveMemberUserIds,
} from "./conversation.access";
import type { TAnnouncementKind } from "./conversation.interface";
import { MEMBERSHIP_STATUS } from "../../constants/workspace";
import { WorkspaceMemberModel } from "../Workspace/workspaceMember.model";

const populateConversation = (query: ReturnType<typeof ConversationModel.findOne>) =>
  query
    .populate("participants", "name email profileImage role phone")
    .populate("creator", "name email profileImage role");

const ANNOUNCEMENT_META: Record<
  TAnnouncementKind,
  { title: string }
> = {
  admin_managers: { title: "Managers — announcements" },
  admin_members: { title: "Team — announcements" },
};

// ─── Ensure workspace announcement channels ───────────────────────────────────
const ensureWorkspaceChannels = async (
  user: JwtPayload,
  workspaceId: string,
) => {
  const userId = new Types.ObjectId(user.user);
  const wsId = new Types.ObjectId(workspaceId);

  const membership = await getActiveMembership(wsId, userId);
  if (!membership) {
    throw new AppError(HttpStatus.FORBIDDEN, "Not a member of this workspace");
  }

  const kinds: TAnnouncementKind[] = ["admin_managers", "admin_members"];
  const channels = [];

  for (const kind of kinds) {
    const audience = await listActiveMemberUserIds(
      wsId,
      announcementAudienceRoles(kind),
    );

    let channel = await ConversationModel.findOne({
      type: "announcement",
      workspaceId: wsId,
      announcementKind: kind,
      isDeleted: false,
    });

    if (!channel) {
      channel = await ConversationModel.create({
        type: "announcement",
        workspaceId: wsId,
        announcementKind: kind,
        title: ANNOUNCEMENT_META[kind].title,
        adminOnlyPost: true,
        participants: audience.length ? audience : [userId],
        creator: userId,
        lastMessageAt: new Date(),
      });
    } else {
      // Keep participant list roughly in sync for notifications
      await ConversationModel.updateOne(
        { _id: channel._id },
        {
          $set: {
            participants: audience.length ? audience : channel.participants,
            title: channel.title || ANNOUNCEMENT_META[kind].title,
            adminOnlyPost: true,
          },
        },
      );
      channel = await ConversationModel.findById(channel._id);
    }

    channels.push(
      await populateConversation(ConversationModel.findById(channel!._id)),
    );
  }

  return channels;
};

// ─── Create Or Get workspace DM ───────────────────────────────────────────────
const createOrGetConversation = async (
  user: JwtPayload,
  recipientId: string,
  workspaceId?: string,
) => {
  const userId = new Types.ObjectId(user.user);
  const otherUserId = new Types.ObjectId(recipientId);

  if (userId.equals(otherUserId)) {
    throw new AppError(
      HttpStatus.BAD_REQUEST,
      "Cannot start conversation with yourself",
    );
  }

  const recipientExists = await UserModel.findById(otherUserId);
  if (!recipientExists || recipientExists.isDeleted) {
    throw new AppError(HttpStatus.NOT_FOUND, "Recipient user does not exist");
  }

  if (workspaceId) {
    await assertDirectChatAllowed(workspaceId, userId, otherUserId);
  }

  const filter: Record<string, unknown> = {
    isDeleted: false,
    type: "direct",
    participants: { $all: [userId, otherUserId], $size: 2 },
  };
  if (workspaceId) {
    filter.workspaceId = new Types.ObjectId(workspaceId);
  }

  let conversation = await populateConversation(
    ConversationModel.findOne(filter),
  );

  if (!conversation) {
    const created = await ConversationModel.create({
      type: "direct",
      workspaceId: workspaceId ? new Types.ObjectId(workspaceId) : null,
      participants: [userId, otherUserId],
      creator: userId,
      adminOnlyPost: false,
      lastMessageAt: new Date(),
    });

    conversation = await populateConversation(
      ConversationModel.findById(created._id),
    );
  }

  return conversation;
};

// ─── Get All My Conversations (optionally scoped to workspace) ────────────────
const getMyConversations = async (
  user: JwtPayload,
  query: Record<string, unknown>,
) => {
  const userId = new Types.ObjectId(user.user);
  const workspaceId =
    typeof query.workspaceId === "string" ? query.workspaceId : undefined;

  if (workspaceId) {
    // Ensure announcement channels exist when opening inbox
    await ensureWorkspaceChannels(user, workspaceId);

    const membership = await getActiveMembership(workspaceId, userId);
    if (!membership) {
      throw new AppError(HttpStatus.FORBIDDEN, "Not a member of this workspace");
    }

    const role = membership.role;
    const announcementKinds: TAnnouncementKind[] = [];
    if (role === "admin" || role === "manager") {
      announcementKinds.push("admin_managers");
    }
    if (role === "admin" || role === "member") {
      announcementKinds.push("admin_members");
    }

    const or: Record<string, unknown>[] = [
      {
        type: "direct",
        workspaceId: new Types.ObjectId(workspaceId),
        participants: userId,
        isDeleted: false,
      },
    ];
    if (announcementKinds.length) {
      or.push({
        type: "announcement",
        workspaceId: new Types.ObjectId(workspaceId),
        announcementKind: { $in: announcementKinds },
        isDeleted: false,
      });
    }

    const { workspaceId: _ws, ...restQuery } = query;
    const conversationQuery = new QueryBuilder(
      ConversationModel.find({ $or: or })
        .populate("participants", "name email profileImage role phone")
        .populate("creator", "name email profileImage role")
        .sort({ lastMessageAt: -1 }),
      restQuery,
    )
      .sort()
      .paginate()
      .fields();

    const meta = await conversationQuery.countTotal();
    const result = await conversationQuery.modelQuery;
    return { meta, result };
  }

  const filter: Record<string, unknown> = {
    isDeleted: false,
    $or: [
      { type: "direct", participants: userId },
      { type: { $exists: false }, participants: userId },
      // legacy docs without type
    ],
  };

  // Also include announcement channels for workspaces the user belongs to
  const memberships = await WorkspaceMemberModel.find({
    userId,
    status: MEMBERSHIP_STATUS.active,
  }).select("workspaceId role");

  const announcementOr: Record<string, unknown>[] = [];
  for (const m of memberships) {
    const kinds: TAnnouncementKind[] = [];
    if (m.role === "admin" || m.role === "manager") kinds.push("admin_managers");
    if (m.role === "admin" || m.role === "member") kinds.push("admin_members");
    if (!kinds.length) continue;
    announcementOr.push({
      type: "announcement",
      workspaceId: m.workspaceId,
      announcementKind: { $in: kinds },
      isDeleted: false,
    });
  }

  const conversationQuery = new QueryBuilder(
    ConversationModel.find({
      isDeleted: false,
      $or: [{ participants: userId, type: { $ne: "announcement" } }, ...announcementOr],
    })
      .populate("participants", "name email profileImage role phone")
      .populate("creator", "name email profileImage role")
      .sort({ lastMessageAt: -1 }),
    query,
  )
    .filter()
    .sort()
    .paginate()
    .fields();

  const meta = await conversationQuery.countTotal();
  const result = await conversationQuery.modelQuery;

  return { meta, result };
};

const getConversationById = async (
  user: JwtPayload,
  conversationId: string,
) => {
  const userId = new Types.ObjectId(user.user);

  const conversation = await populateConversation(
    ConversationModel.findById(conversationId),
  );

  if (!conversation || conversation.isDeleted) {
    throw new AppError(HttpStatus.NOT_FOUND, "Conversation not found");
  }

  await assertCanAccess(conversation, userId);
  return conversation;
};

const deleteConversation = async (user: JwtPayload, conversationId: string) => {
  const userId = new Types.ObjectId(user.user);

  const conversation = await ConversationModel.findById(conversationId);

  if (!conversation || conversation.isDeleted) {
    throw new AppError(HttpStatus.NOT_FOUND, "Conversation not found");
  }

  if (conversation.type === "announcement") {
    throw new AppError(
      HttpStatus.BAD_REQUEST,
      "Announcement channels cannot be deleted",
    );
  }

  await assertCanAccess(conversation, userId);

  await ConversationModel.findByIdAndUpdate(
    conversationId,
    { $set: { isDeleted: true, isActive: false } },
    { returnDocument: 'after' },
  );

  return null;
};

export const conversationServices = {
  ensureWorkspaceChannels,
  createOrGetConversation,
  getMyConversations,
  getConversationById,
  deleteConversation,
};
