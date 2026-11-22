import { Types } from "mongoose";

export type TConversationType = "direct" | "announcement";
export type TAnnouncementKind = "admin_managers" | "admin_members";

export interface IConversation {
  _id?: Types.ObjectId;
  type: TConversationType;
  /** Required for workspace DMs and announcement channels */
  workspaceId?: Types.ObjectId | null;
  announcementKind?: TAnnouncementKind | null;
  title?: string | null;
  /** When true, only workspace admins may post (announcements) */
  adminOnlyPost?: boolean;
  participants: Types.ObjectId[];
  creator?: Types.ObjectId;
  lastMessage?: string | null;
  lastMessageAt?: Date | null;
  isActive?: boolean;
  isDeleted?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}
