import HttpStatus from "http-status";
import mongoose, { Types } from "mongoose";
import AppError from "../../erros/AppError";
import {
  ACTIVITY_ACTION,
  MEMBERSHIP_STATUS,
  TTaskPriority,
} from "../../constants/workspace";
import {
  assertCanEditTask,
  getMembershipRole,
} from "../../utils/taskPermissions";
import { activityServices } from "../Activity/activity.service";
import { sendNotification } from "../Notification/notification.utils";
import { UserModel } from "../User/user.model";
import { WorkspaceMemberModel } from "../Workspace/workspaceMember.model";
import { ITask, TASK_STATUSES, TTaskStatus } from "./task.interface";
import { TaskModel } from "./task.model";

type CreateTaskPayload = {
  title: string;
  assignTo: string;
  status?: TTaskStatus;
  start_date: string;
  end_date: string;
  userEmail: string;
  email?: string;
  workspaceId?: string;
  projectId?: string;
  createdBy?: string;
  assigneeId?: string;
  description?: string;
  priority?: TTaskPriority;
  labels?: string[];
  labelIds?: string[];
  dueDate?: string | Date;
  estimateHours?: number | null;
};

type EditTaskPayload = Partial<
  Pick<
    ITask,
    | "title"
    | "assignTo"
    | "status"
    | "start_date"
    | "end_date"
    | "description"
    | "priority"
    | "labels"
    | "dueDate"
    | "projectId"
    | "assigneeId"
    | "estimateHours"
  >
> & {
  labelIds?: string[];
};

const createTask = async (payload: CreateTaskPayload) => {
  if (!payload.title || !payload.assignTo || !payload.userEmail) {
    throw new AppError(
      HttpStatus.BAD_REQUEST,
      "title, assignTo and userEmail are required",
    );
  }

  let assigneeId: Types.ObjectId | string | null = payload.assigneeId || null;
  let assignTo = payload.assignTo;

  if (assigneeId) {
    const assignee = await UserModel.findById(assigneeId).select("name email");
    if (!assignee) {
      throw new AppError(HttpStatus.NOT_FOUND, "Assignee user not found");
    }
    assignTo = assignee.name || assignee.email;
  }

  const doc = await TaskModel.create({
    title: payload.title,
    assignTo,
    assigneeId,
    start_date: payload.start_date,
    end_date: payload.end_date,
    userEmail: payload.userEmail,
    email: payload.email || payload.userEmail,
    status: payload.status || "general",
    workspaceId: payload.workspaceId || null,
    projectId: payload.projectId || null,
    createdBy: payload.createdBy || null,
    description: payload.description || "",
    priority: payload.priority || "medium",
    labels: payload.labels || [],
    labelIds: payload.labelIds || [],
    dueDate: payload.dueDate
      ? new Date(payload.dueDate)
      : payload.end_date
        ? new Date(payload.end_date)
        : null,
    estimateHours:
      payload.estimateHours === undefined ? null : payload.estimateHours,
  });

  if (payload.workspaceId && payload.createdBy) {
    await activityServices.logActivity({
      workspaceId: payload.workspaceId,
      actorId: payload.createdBy,
      action: ACTIVITY_ACTION.task_created,
      taskId: doc._id,
      projectId: payload.projectId,
      meta: { title: doc.title },
    });
  }

  if (assigneeId && payload.createdBy && String(assigneeId) !== String(payload.createdBy)) {
    try {
      await sendNotification({
        recipientId: assigneeId,
        senderId: payload.createdBy,
        type: "task_assigned",
        title: "New task assigned",
        message: `You were assigned: ${doc.title}`,
        data: { taskId: String(doc._id), workspaceId: payload.workspaceId },
      });
    } catch {
      // non-blocking
    }
  }

  return doc;
};

const getTasks = async (email?: string) => {
  const filter: Record<string, unknown> = { isArchived: { $ne: true } };
  if (email) {
    filter.$or = [{ userEmail: email }, { email }];
  }

  return TaskModel.find(filter).sort({ createdAt: -1 });
};

const getWorkspaceTasks = async (
  workspaceId: string,
  userId: string,
  query: {
    projectId?: string;
    assigneeId?: string;
    status?: string;
    includeArchived?: boolean;
  } = {},
) => {
  const membership = await WorkspaceMemberModel.findOne({
    workspaceId,
    userId,
    status: MEMBERSHIP_STATUS.active,
  });

  if (!membership) {
    throw new AppError(
      HttpStatus.FORBIDDEN,
      "You are not a member of this workspace",
    );
  }

  const filter: Record<string, unknown> = { workspaceId };
  if (!query.includeArchived) filter.isArchived = { $ne: true };
  if (query.projectId) filter.projectId = query.projectId;
  if (query.assigneeId) filter.assigneeId = query.assigneeId;
  if (query.status) filter.status = query.status;

  return TaskModel.find(filter)
    .populate("assigneeId", "name email profileImage")
    .populate("createdBy", "name email")
    .populate("projectId", "name status")
    .sort({ createdAt: -1 });
};

const getTaskById = async (id: string) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError(HttpStatus.BAD_REQUEST, "Invalid task id");
  }

  const task = await TaskModel.findById(id);
  if (!task) {
    throw new AppError(HttpStatus.NOT_FOUND, "Task not found");
  }

  return task;
};

const updateTask = async (
  id: string,
  payload: EditTaskPayload,
  actorId?: string,
  platformRole?: string,
) => {
  const task = await getTaskById(id);

  if (task.workspaceId && actorId) {
    const role = await getMembershipRole(String(task.workspaceId), actorId);
    assertCanEditTask(task, actorId, role, platformRole);
  }

  const {
    title,
    assignTo,
    status,
    start_date,
    end_date,
    description,
    priority,
    labels,
    dueDate,
    projectId,
    assigneeId,
    estimateHours,
    labelIds,
  } = payload;

  if (title !== undefined) task.title = title;
  if (assignTo !== undefined) task.assignTo = assignTo;
  if (status !== undefined) task.status = status;
  if (start_date !== undefined) task.start_date = start_date;
  if (end_date !== undefined) task.end_date = end_date;
  if (description !== undefined) task.description = description;
  if (priority !== undefined) task.priority = priority;
  if (labels !== undefined) task.labels = labels;
  if (dueDate !== undefined) {
    task.dueDate = dueDate ? new Date(dueDate as Date) : null;
  } else if (end_date !== undefined) {
    // Keep calendar in sync when only end_date is edited
    task.dueDate = end_date ? new Date(end_date) : null;
  }
  if (projectId !== undefined) task.projectId = projectId;
  if (assigneeId !== undefined) task.assigneeId = assigneeId;
  if (estimateHours !== undefined) task.estimateHours = estimateHours;
  if (labelIds !== undefined) {
    task.labelIds = labelIds.map((lid) => new Types.ObjectId(lid));
  }

  await task.save();

  if (task.workspaceId && actorId) {
    await activityServices.logActivity({
      workspaceId: task.workspaceId,
      actorId,
      action: ACTIVITY_ACTION.task_updated,
      taskId: task._id,
      meta: payload as Record<string, unknown>,
    });
  }

  return task;
};

const deleteTask = async (
  id: string,
  actorId?: string,
  platformRole?: string,
) => {
  const task = await getTaskById(id);

  if (task.workspaceId && actorId) {
    const role = await getMembershipRole(String(task.workspaceId), actorId);
    // Members cannot delete others' tasks; managers+ can
    assertCanEditTask(task, actorId, role, platformRole);
    if (role === "member") {
      throw new AppError(
        HttpStatus.FORBIDDEN,
        "Members cannot delete tasks; ask a manager or admin",
      );
    }
  }

  const result = await TaskModel.deleteOne({ _id: id });
  return {
    deletedCount: result.deletedCount,
    acknowledged: result.acknowledged,
  };
};

const archiveTask = async (id: string, actorId: string) => {
  const task = await getTaskById(id);
  task.isArchived = true;
  await task.save();

  if (task.workspaceId) {
    await activityServices.logActivity({
      workspaceId: task.workspaceId,
      actorId,
      action: ACTIVITY_ACTION.task_archived,
      taskId: task._id,
    });
  }

  return task;
};

const updateTaskStatus = async (
  id: string,
  status: TTaskStatus,
  actorId?: string,
  platformRole?: string,
) => {
  if (!status || typeof status !== "string") {
    throw new AppError(HttpStatus.BAD_REQUEST, "Invalid status");
  }

  const task = await getTaskById(id);

  if (task.workspaceId && actorId) {
    const role = await getMembershipRole(String(task.workspaceId), actorId);
    assertCanEditTask(task, actorId, role, platformRole);
  }

  const previous = task.status;
  task.status = status;
  await task.save();

  if (task.workspaceId && actorId) {
    await activityServices.logActivity({
      workspaceId: task.workspaceId,
      actorId,
      action: ACTIVITY_ACTION.task_status_changed,
      taskId: task._id,
      meta: { from: previous, to: status },
    });
  }

  return {
    modifiedCount: 1,
    matchedCount: 1,
    acknowledged: true,
  };
};

const moveStatusForward = async (
  id: string,
  updateStatus?: string,
  actorId?: string,
  platformRole?: string,
) => {
  const task = await getTaskById(id);
  const next =
    updateStatus ||
    ({
      general: "backlog",
      backlog: "in-progress",
      "in-progress": "paused",
      paused: "ready-to-launch",
      "ready-to-launch": "",
    } as Record<string, string>)[task.status];

  if (!next) {
    throw new AppError(
      HttpStatus.BAD_REQUEST,
      "Task is already at the final status",
    );
  }

  return updateTaskStatus(id, next as TTaskStatus, actorId, platformRole);
};

const moveStatusBack = async (
  id: string,
  updateBackStatus?: string,
  actorId?: string,
  platformRole?: string,
) => {
  const task = await getTaskById(id);
  const prev =
    updateBackStatus ||
    ({
      backlog: "general",
      "in-progress": "backlog",
      paused: "in-progress",
      "ready-to-launch": "paused",
      general: "",
    } as Record<string, string>)[task.status];

  if (!prev) {
    throw new AppError(
      HttpStatus.BAD_REQUEST,
      "Task is already at the first status",
    );
  }

  return updateTaskStatus(id, prev as TTaskStatus, actorId, platformRole);
};

const assignTask = async (
  id: string,
  assigneeId: string,
  actorId: string,
) => {
  const task = await getTaskById(id);

  if (!task.workspaceId) {
    throw new AppError(
      HttpStatus.BAD_REQUEST,
      "Assignment requires a workspace-scoped task",
    );
  }

  const membership = await WorkspaceMemberModel.findOne({
    workspaceId: task.workspaceId,
    userId: assigneeId,
    status: MEMBERSHIP_STATUS.active,
  });

  if (!membership) {
    throw new AppError(
      HttpStatus.BAD_REQUEST,
      "Assignee must be an active workspace member",
    );
  }

  const assignee = await UserModel.findById(assigneeId).select("name email");
  if (!assignee) {
    throw new AppError(HttpStatus.NOT_FOUND, "Assignee not found");
  }

  const previousAssignee = task.assigneeId;
  task.assigneeId = new Types.ObjectId(assigneeId);
  task.assignTo = assignee.name || assignee.email;
  await task.save();

  await activityServices.logActivity({
    workspaceId: task.workspaceId,
    actorId,
    action: ACTIVITY_ACTION.task_assigned,
    taskId: task._id,
    meta: {
      assigneeId,
      previousAssignee: previousAssignee ? String(previousAssignee) : null,
    },
  });

  if (String(assigneeId) !== String(actorId)) {
    try {
      await sendNotification({
        recipientId: assigneeId,
        senderId: actorId,
        type: "task_assigned",
        title: "Task assigned to you",
        message: `Assigned: ${task.title}`,
        data: {
          taskId: String(task._id),
          workspaceId: String(task.workspaceId),
        },
      });
    } catch {
      // non-blocking
    }
  }

  return task.populate("assigneeId", "name email profileImage");
};

const getTaskStats = async (opts: {
  userId: string;
  role: string;
  email?: string;
  workspaceId?: string;
  scope?: string;
}) => {
  const match: Record<string, unknown> = { isArchived: { $ne: true } };
  const isPlatformAdmin =
    opts.role === "admin" || opts.role === "super_admin";

  if (isPlatformAdmin && (opts.scope === "platform" || !opts.workspaceId)) {
    // Platform operators see product-wide pipeline totals
  } else if (opts.workspaceId) {
    match.workspaceId = new Types.ObjectId(opts.workspaceId);
  } else {
    // Regular users: only workspaces they belong to (never global)
    const memberships = await WorkspaceMemberModel.find({
      userId: opts.userId,
      status: MEMBERSHIP_STATUS.active,
    }).select("workspaceId");
    const ids = memberships.map((m) => m.workspaceId);
    match.workspaceId = { $in: ids };
  }

  const stats = await TaskModel.aggregate([
    { $match: match },
    { $group: { _id: "$status", count: { $sum: 1 } } },
  ]);

  const countByStatus = new Map(
    stats.map((row: { _id: string; count: number }) => [row._id, row.count]),
  );

  return TASK_STATUSES.map((status) => ({
    _id: status,
    count: countByStatus.get(status) || 0,
  }));
};

const searchFilterTasks = async (query: {
  status?: string;
  title?: string;
  email?: string;
  workspaceId?: string;
}) => {
  const filter: Record<string, unknown> = { isArchived: { $ne: true } };

  if (query.workspaceId) {
    filter.workspaceId = query.workspaceId;
  } else if (query.email) {
    filter.$or = [{ userEmail: query.email }, { email: query.email }];
  }

  if (query.status) {
    filter.status = query.status;
  }

  if (query.title) {
    filter.title = { $regex: query.title, $options: "i" };
  }

  const result = await TaskModel.find(filter).sort({ createdAt: -1 });

  return {
    tasks: TASK_STATUSES,
    result,
  };
};

export const taskServices = {
  createTask,
  getTasks,
  getWorkspaceTasks,
  getTaskById,
  updateTask,
  deleteTask,
  archiveTask,
  updateTaskStatus,
  moveStatusForward,
  moveStatusBack,
  assignTask,
  getTaskStats,
  searchFilterTasks,
};
