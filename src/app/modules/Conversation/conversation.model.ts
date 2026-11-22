import { model, Schema } from "mongoose";
import { IConversation } from "./conversation.interface";

const conversationSchema = new Schema<IConversation>(
  {
    type: {
      type: String,
      enum: ["direct", "announcement"],
      default: "direct",
      index: true,
    },
    workspaceId: {
      type: Schema.Types.ObjectId,
      ref: "Workspace",
      default: null,
      index: true,
    },
    announcementKind: {
      type: String,
      enum: ["admin_managers", "admin_members"],
      default: undefined,
    },
    title: {
      type: String,
      default: null,
    },
    adminOnlyPost: {
      type: Boolean,
      default: false,
    },
    participants: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],
    creator: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    lastMessage: {
      type: String,
      default: null,
    },
    lastMessageAt: {
      type: Date,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

conversationSchema.index({ participants: 1 });
conversationSchema.index({ lastMessageAt: -1 });
conversationSchema.index(
  { workspaceId: 1, type: 1, announcementKind: 1 },
  {
    unique: true,
    partialFilterExpression: {
      type: "announcement",
      isDeleted: false,
      announcementKind: { $type: "string" },
    },
  },
);

export const ConversationModel = model<IConversation>(
  "Conversation",
  conversationSchema,
);
