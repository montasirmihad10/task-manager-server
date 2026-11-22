import { Schema, model, Types, Document } from "mongoose";

export interface IReminder extends Document {
  _id: Types.ObjectId;
  taskId: Types.ObjectId;
  workspaceId: Types.ObjectId;
  userId: Types.ObjectId;
  remindAt: Date;
  sentAt?: Date | null;
  kind: "due_soon" | "overdue" | "custom";
}

const schema = new Schema<IReminder>(
  {
    taskId: {
      type: Schema.Types.ObjectId,
      ref: "Task",
      required: true,
      index: true,
    },
    workspaceId: {
      type: Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
    },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    remindAt: { type: Date, required: true, index: true },
    sentAt: { type: Date, default: null },
    kind: {
      type: String,
      enum: ["due_soon", "overdue", "custom"],
      default: "due_soon",
    },
  },
  { timestamps: true },
);

schema.index({ sentAt: 1, remindAt: 1 });

export const ReminderModel = model<IReminder>("Reminder", schema);
