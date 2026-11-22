import { Schema, model, Types, Document } from "mongoose";
export type TInviteRole = "manager" | "member";

export interface IWorkspaceInvite extends Document {
  _id: Types.ObjectId;
  workspaceId: Types.ObjectId;
  email: string;
  role: TInviteRole;
  token: string;
  invitedBy: Types.ObjectId;
  expiresAt: Date;
  acceptedAt?: Date | null;
  acceptedBy?: Types.ObjectId | null;
  revokedAt?: Date | null;
}

const schema = new Schema<IWorkspaceInvite>(
  {
    workspaceId: {
      type: Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
      index: true,
    },
    email: { type: String, required: true, lowercase: true, trim: true },
    role: {
      type: String,
      enum: ["manager", "member"],
      default: "member",
    },
    token: { type: String, required: true, unique: true, index: true },
    invitedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    expiresAt: { type: Date, required: true },
    acceptedAt: { type: Date, default: null },
    acceptedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    revokedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

schema.index({ workspaceId: 1, email: 1 });

export const WorkspaceInviteModel = model<IWorkspaceInvite>(
  "WorkspaceInvite",
  schema,
);
