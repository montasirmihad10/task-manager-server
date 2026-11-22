import { Schema, model, Types, Document } from "mongoose";

export interface ISubtask extends Document {
  _id: Types.ObjectId;
  taskId: Types.ObjectId;
  workspaceId: Types.ObjectId;
  title: string;
  isDone: boolean;
  order: number;
  assigneeId?: Types.ObjectId | null;
  isDeleted: boolean;
}

const schema = new Schema<ISubtask>(
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
      index: true,
    },
    title: { type: String, required: true, trim: true },
    isDone: { type: Boolean, default: false },
    order: { type: Number, default: 0 },
    assigneeId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export const SubtaskModel = model<ISubtask>("Subtask", schema);
