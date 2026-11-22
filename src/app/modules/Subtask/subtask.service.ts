import HttpStatus from "http-status";
import AppError from "../../erros/AppError";
import { TaskModel } from "../Task/task.model";
import { SubtaskModel } from "./subtask.model";

const listSubtasks = async (taskId: string) =>
  SubtaskModel.find({ taskId, isDeleted: false }).sort({ order: 1 });

const addSubtask = async (
  taskId: string,
  payload: { title: string; assigneeId?: string },
) => {
  const task = await TaskModel.findById(taskId);
  if (!task) throw new AppError(HttpStatus.NOT_FOUND, "Task not found");
  if (!task.workspaceId) {
    throw new AppError(
      HttpStatus.BAD_REQUEST,
      "Subtasks require a workspace-scoped task",
    );
  }

  const count = await SubtaskModel.countDocuments({
    taskId,
    isDeleted: false,
  });

  return SubtaskModel.create({
    taskId,
    workspaceId: task.workspaceId,
    title: payload.title.trim(),
    assigneeId: payload.assigneeId || null,
    order: count,
  });
};

const updateSubtask = async (
  id: string,
  payload: Partial<{ title: string; isDone: boolean; order: number; assigneeId: string | null }>,
) => {
  const sub = await SubtaskModel.findOneAndUpdate(
    { _id: id, isDeleted: false },
    { $set: payload },
    { returnDocument: 'after' },
  );
  if (!sub) throw new AppError(HttpStatus.NOT_FOUND, "Subtask not found");
  return sub;
};

const deleteSubtask = async (id: string) => {
  const sub = await SubtaskModel.findById(id);
  if (!sub || sub.isDeleted) {
    throw new AppError(HttpStatus.NOT_FOUND, "Subtask not found");
  }
  sub.isDeleted = true;
  await sub.save();
  return sub;
};

export const subtaskServices = {
  listSubtasks,
  addSubtask,
  updateSubtask,
  deleteSubtask,
};
