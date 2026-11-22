import { Schema, model } from "mongoose";
import {
  MEMBERSHIP_STATUS,
  WORKSPACE_ROLES,
} from "../../constants/workspace";
import { IWorkspaceMember } from "./workspaceMember.interface";

const workspaceMemberSchema = new Schema<IWorkspaceMember>(
  {
    workspaceId: {
      type: Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    role: {
      type: String,
      enum: WORKSPACE_ROLES,
      required: true,
      default: "member",
    },
    status: {
      type: String,
      enum: Object.values(MEMBERSHIP_STATUS),
      default: MEMBERSHIP_STATUS.active,
    },
    invitedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true },
);

workspaceMemberSchema.index(
  { workspaceId: 1, userId: 1 },
  { unique: true },
);

export const WorkspaceMemberModel = model<IWorkspaceMember>(
  "WorkspaceMember",
  workspaceMemberSchema,
);
