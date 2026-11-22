import { Document, Types } from "mongoose";
import {
  TMembershipStatus,
  TWorkspaceRole,
} from "../../constants/workspace";

export interface IWorkspaceMember extends Document {
  _id: Types.ObjectId;
  workspaceId: Types.ObjectId;
  userId: Types.ObjectId;
  role: TWorkspaceRole;
  status: TMembershipStatus;
  invitedBy?: Types.ObjectId | null;
  joinedAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}
