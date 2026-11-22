import { Types } from "mongoose";
import { TActivityAction } from "../../constants/workspace";
import { ActivityLogModel } from "./activity.model";

type LogActivityInput = {
  workspaceId: string | Types.ObjectId;
  actorId: string | Types.ObjectId;
  action: TActivityAction;
  taskId?: string | Types.ObjectId | null;
  projectId?: string | Types.ObjectId | null;
  documentId?: string | Types.ObjectId | null;
  meta?: Record<string, unknown>;
};

const logActivity = async (input: LogActivityInput) => {
  try {
    return await ActivityLogModel.create({
      workspaceId: input.workspaceId,
      actorId: input.actorId,
      action: input.action,
      taskId: input.taskId || null,
      projectId: input.projectId || null,
      documentId: input.documentId || null,
      meta: input.meta || {},
    });
  } catch (error) {
    // Activity must never break primary writes
    // eslint-disable-next-line no-console
    console.error("Activity log failed:", error);
    return null;
  }
};

const getTaskActivity = async (taskId: string, limit = 50) => {
  return ActivityLogModel.find({ taskId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate("actorId", "name email profileImage")
    .lean();
};

const getWorkspaceActivity = async (workspaceId: string, limit = 50) => {
  return ActivityLogModel.find({ workspaceId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate("actorId", "name email profileImage")
    .lean();
};

export const activityServices = {
  logActivity,
  getTaskActivity,
  getWorkspaceActivity,
};
