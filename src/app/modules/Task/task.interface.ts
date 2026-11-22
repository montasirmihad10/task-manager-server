import { Document, Types } from "mongoose";
import { TTaskPriority } from "../../constants/workspace";
import { TRecurrenceFreq } from "../../constants/product";

export type TTaskStatus =
  | "general"
  | "backlog"
  | "in-progress"
  | "paused"
  | "ready-to-launch"
  | string;

export interface ITaskAttachment {
  name: string;
  url: string;
  mimeType?: string;
  size?: number;
  uploadedAt?: Date;
}

export interface ITaskRecurrence {
  freq: TRecurrenceFreq;
  interval: number;
  nextRunAt?: Date | null;
  endAt?: Date | null;
  enabled: boolean;
}

export interface ITask extends Document {
  _id: Types.ObjectId;
  title: string;
  assignTo: string;
  status: TTaskStatus;
  start_date: string;
  end_date: string;
  userEmail: string;
  email?: string;

  workspaceId?: Types.ObjectId | null;
  projectId?: Types.ObjectId | null;
  createdBy?: Types.ObjectId | null;
  assigneeId?: Types.ObjectId | null;
  description?: string;
  priority?: TTaskPriority;
  labels?: string[];
  labelIds?: Types.ObjectId[];
  dueDate?: Date | null;
  attachments?: ITaskAttachment[];
  isArchived?: boolean;

  estimateHours?: number | null;
  watcherIds?: Types.ObjectId[];
  blockedBy?: Types.ObjectId[];
  blocks?: Types.ObjectId[];
  recurrence?: ITaskRecurrence | null;
  lastReminderAt?: Date | null;

  createdAt?: Date;
  updatedAt?: Date;
}

export const TASK_STATUSES: TTaskStatus[] = [
  "general",
  "backlog",
  "in-progress",
  "paused",
  "ready-to-launch",
];
