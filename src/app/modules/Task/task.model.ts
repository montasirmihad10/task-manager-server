import mongoose, { Schema } from "mongoose";
import { TASK_PRIORITY } from "../../constants/workspace";
import { RECURRENCE_FREQ } from "../../constants/product";
import { ITask } from "./task.interface";

const attachmentSchema = new Schema(
  {
    name: { type: String, required: true },
    url: { type: String, required: true },
    mimeType: { type: String },
    size: { type: Number },
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const recurrenceSchema = new Schema(
  {
    freq: {
      type: String,
      enum: Object.values(RECURRENCE_FREQ),
      required: true,
    },
    interval: { type: Number, default: 1, min: 1 },
    nextRunAt: { type: Date, default: null },
    endAt: { type: Date, default: null },
    enabled: { type: Boolean, default: true },
  },
  { _id: false },
);

const taskSchema = new Schema<ITask>(
  {
    title: { type: String, required: true, trim: true },
    assignTo: { type: String, required: true, trim: true },
    // Flexible string — custom workspace statuses use arbitrary keys
    status: {
      type: String,
      default: "general",
      required: true,
      index: true,
    },
    start_date: { type: String, required: true },
    end_date: { type: String, required: true },
    userEmail: { type: String, required: true, trim: true, index: true },
    email: { type: String, trim: true },

    workspaceId: {
      type: Schema.Types.ObjectId,
      ref: "Workspace",
      default: null,
      index: true,
    },
    projectId: {
      type: Schema.Types.ObjectId,
      ref: "Project",
      default: null,
      index: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    assigneeId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    description: { type: String, default: "" },
    priority: {
      type: String,
      enum: Object.values(TASK_PRIORITY),
      default: TASK_PRIORITY.medium,
    },
    labels: { type: [String], default: [] },
    labelIds: [{ type: Schema.Types.ObjectId, ref: "Label" }],
    dueDate: { type: Date, default: null, index: true },
    attachments: { type: [attachmentSchema], default: [] },
    isArchived: { type: Boolean, default: false, index: true },

    estimateHours: { type: Number, default: null, min: 0 },
    watcherIds: [{ type: Schema.Types.ObjectId, ref: "User" }],
    blockedBy: [{ type: Schema.Types.ObjectId, ref: "Task" }],
    blocks: [{ type: Schema.Types.ObjectId, ref: "Task" }],
    recurrence: { type: recurrenceSchema, default: null },
    lastReminderAt: { type: Date, default: null },
  },
  { timestamps: true },
);

taskSchema.index({ workspaceId: 1, status: 1 });
taskSchema.index({ workspaceId: 1, projectId: 1 });
taskSchema.index({ workspaceId: 1, dueDate: 1 });
taskSchema.index({ title: "text", description: "text", assignTo: "text" });

// overwriteModels: schema evolved (custom status, watchers, etc.)
export const TaskModel = mongoose.model<ITask>(
  "Task",
  taskSchema,
  undefined,
  { overwriteModels: true },
);
