import HttpStatus from "http-status";
import { Types } from "mongoose";
import AppError from "../../erros/AppError";
import { CommentModel } from "../Comment/comment.model";
import { DocumentModel } from "../Document/document.model";
import { SubtaskModel } from "../Subtask/subtask.model";
import { activityServices } from "../Activity/activity.service";
import { reminderServices } from "../Reminder/reminder.service";
import {
  assertCanEditTask,
  getMembershipRole,
  isManagerOrAbove,
} from "../../utils/taskPermissions";
import { TaskModel } from "./task.model";
import { taskServices } from "./task.service";
import { ISavedViewFilters } from "../SavedView/savedView.model";

const buildFilterFromQuery = (
  workspaceId: string,
  userId: string,
  q: ISavedViewFilters & { includeArchived?: boolean },
) => {
  const filter: Record<string, unknown> = { workspaceId };
  if (!q.includeArchived) filter.isArchived = { $ne: true };
  if (q.projectId) filter.projectId = q.projectId;
  if (q.assigneeId) filter.assigneeId = q.assigneeId;
  if (q.mine) filter.assigneeId = userId;
  if (q.status) filter.status = q.status;
  if (q.priority) filter.priority = q.priority;
  if (q.labelIds?.length) {
    filter.labelIds = {
      $in: q.labelIds.map((id) => new Types.ObjectId(id)),
    };
  }

  const now = new Date();
  if (q.due === "overdue") {
    filter.dueDate = { $lt: now };
    filter.status = { $ne: "ready-to-launch" };
  } else if (q.due === "today") {
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    const end = new Date(now);
    end.setHours(23, 59, 59, 999);
    filter.dueDate = { $gte: start, $lte: end };
  } else if (q.due === "week") {
    const end = new Date(now);
    end.setDate(end.getDate() + 7);
    filter.dueDate = { $gte: now, $lte: end };
  } else if (q.due === "none") {
    filter.$or = [{ dueDate: null }, { dueDate: { $exists: false } }];
  }

  return filter;
};

const advancedFilter = async (
  workspaceId: string,
  userId: string,
  q: ISavedViewFilters & { includeArchived?: boolean },
) => {
  const filter = buildFilterFromQuery(workspaceId, userId, q);
  let query = TaskModel.find(filter)
    .populate("assigneeId", "name email profileImage")
    .populate("createdBy", "name email")
    .populate("projectId", "name")
    .populate("labelIds", "name color")
    .sort({ createdAt: -1 });

  if (q.search) {
    query = TaskModel.find({
      ...filter,
      $text: { $search: q.search },
    })
      .populate("assigneeId", "name email profileImage")
      .populate("createdBy", "name email")
      .populate("projectId", "name")
      .populate("labelIds", "name color")
      .sort({ score: { $meta: "textScore" } });
  }

  return query;
};

const searchTasks = async (
  workspaceId: string,
  userId: string,
  text: string,
) => {
  if (!text?.trim()) return [];
  return advancedFilter(workspaceId, userId, { search: text.trim() });
};

const getTaskDetail = async (taskId: string, userId: string) => {
  const task = await TaskModel.findById(taskId)
    .populate("assigneeId", "name email profileImage")
    .populate("createdBy", "name email profileImage")
    .populate("projectId", "name status")
    .populate("labelIds", "name color")
    .populate("watcherIds", "name email profileImage")
    .populate("blockedBy", "title status")
    .populate("blocks", "title status");

  if (!task) throw new AppError(HttpStatus.NOT_FOUND, "Task not found");

  if (task.workspaceId) {
    const role = await getMembershipRole(String(task.workspaceId), userId);
    if (!role) {
      throw new AppError(HttpStatus.FORBIDDEN, "Not a workspace member");
    }
  }

  const [comments, documents, subtasks, activity] = await Promise.all([
    CommentModel.find({ taskId, isDeleted: false })
      .populate("authorId", "name email profileImage")
      .sort({ createdAt: 1 }),
    DocumentModel.find({ taskId, isDeleted: false }).sort({ createdAt: -1 }),
    SubtaskModel.find({ taskId, isDeleted: false }).sort({ order: 1 }),
    activityServices.getTaskActivity(taskId, 40),
  ]);

  const checklistTotal = subtasks.length;
  const checklistDone = subtasks.filter((s) => s.isDone).length;

  return {
    task,
    comments,
    documents,
    subtasks,
    activity,
    checklist: { total: checklistTotal, done: checklistDone },
  };
};

const bulkUpdate = async (
  workspaceId: string,
  userId: string,
  platformRole: string | undefined,
  payload: {
    taskIds: string[];
    status?: string;
    assigneeId?: string | null;
    priority?: string;
    projectId?: string | null;
    archive?: boolean;
  },
) => {
  const role = await getMembershipRole(workspaceId, userId);
  if (!isManagerOrAbove(role) && platformRole !== "super_admin") {
    throw new AppError(
      HttpStatus.FORBIDDEN,
      "Bulk actions require manager or admin",
    );
  }

  const set: Record<string, unknown> = {};
  if (payload.status) set.status = payload.status;
  if (payload.priority) set.priority = payload.priority;
  if (payload.projectId !== undefined) set.projectId = payload.projectId;
  if (payload.archive === true) set.isArchived = true;
  if (payload.assigneeId !== undefined) {
    set.assigneeId = payload.assigneeId;
  }

  const result = await TaskModel.updateMany(
    {
      _id: { $in: payload.taskIds },
      workspaceId,
    },
    { $set: set },
  );

  return {
    matchedCount: result.matchedCount,
    modifiedCount: result.modifiedCount,
  };
};

const exportCsv = async (workspaceId: string, userId: string) => {
  const role = await getMembershipRole(workspaceId, userId);
  if (!role) {
    throw new AppError(HttpStatus.FORBIDDEN, "Not a workspace member");
  }

  const tasks = await TaskModel.find({
    workspaceId,
    isArchived: { $ne: true },
  })
    .populate("assigneeId", "name email")
    .populate("projectId", "name")
    .lean();

  const header = [
    "id",
    "title",
    "status",
    "priority",
    "assignee",
    "project",
    "dueDate",
    "estimateHours",
    "start_date",
    "end_date",
  ];

  const escape = (v: unknown) => {
    const s = v == null ? "" : String(v);
    return `"${s.replace(/"/g, '""')}"`;
  };

  const rows = tasks.map((t) => {
    const assignee = t.assigneeId as { name?: string; email?: string } | null;
    const project = t.projectId as { name?: string } | null;
    return [
      t._id,
      t.title,
      t.status,
      t.priority,
      assignee?.name || assignee?.email || t.assignTo,
      project?.name || "",
      t.dueDate ? new Date(t.dueDate).toISOString().slice(0, 10) : "",
      t.estimateHours ?? "",
      t.start_date,
      t.end_date,
    ]
      .map(escape)
      .join(",");
  });

  return [header.join(","), ...rows].join("\n");
};

const calendarTasks = async (
  workspaceId: string,
  userId: string,
  from: string,
  to: string,
) => {
  const role = await getMembershipRole(workspaceId, userId);
  if (!role) {
    throw new AppError(HttpStatus.FORBIDDEN, "Not a workspace member");
  }

  const rangeStart = new Date(from);
  const rangeEnd = new Date(to);

  // Prefer dueDate; fall back to end_date so boards without explicit dueDate still show
  return TaskModel.find({
    workspaceId,
    isArchived: { $ne: true },
    $or: [
      { dueDate: { $gte: rangeStart, $lte: rangeEnd } },
      {
        $and: [
          { $or: [{ dueDate: null }, { dueDate: { $exists: false } }] },
          { end_date: { $gte: from.slice(0, 10), $lte: to.slice(0, 10) } },
        ],
      },
    ],
  })
    .select(
      "title status priority dueDate end_date assigneeId projectId estimateHours assignTo",
    )
    .populate("assigneeId", "name email")
    .populate("projectId", "name")
    .sort({ dueDate: 1, end_date: 1 });
};

const setWatchers = async (
  taskId: string,
  userId: string,
  watcherIds: string[],
) => {
  const task = await taskServices.getTaskById(taskId);
  if (!task.workspaceId) {
    throw new AppError(HttpStatus.BAD_REQUEST, "Workspace task required");
  }
  const role = await getMembershipRole(String(task.workspaceId), userId);
  assertCanEditTask(task, userId, role);

  task.watcherIds = watcherIds.map((id) => new Types.ObjectId(id));
  await task.save();
  return task.populate("watcherIds", "name email profileImage");
};

const setDependencies = async (
  taskId: string,
  userId: string,
  payload: { blockedBy?: string[]; blocks?: string[] },
) => {
  const task = await taskServices.getTaskById(taskId);
  if (!task.workspaceId) {
    throw new AppError(HttpStatus.BAD_REQUEST, "Workspace task required");
  }
  const role = await getMembershipRole(String(task.workspaceId), userId);
  if (!isManagerOrAbove(role)) {
    throw new AppError(
      HttpStatus.FORBIDDEN,
      "Only managers/admins can set dependencies",
    );
  }

  if (payload.blockedBy) {
    if (payload.blockedBy.includes(taskId)) {
      throw new AppError(HttpStatus.BAD_REQUEST, "Task cannot block itself");
    }
    task.blockedBy = payload.blockedBy.map((id) => new Types.ObjectId(id));
  }
  if (payload.blocks) {
    if (payload.blocks.includes(taskId)) {
      throw new AppError(HttpStatus.BAD_REQUEST, "Task cannot block itself");
    }
    task.blocks = payload.blocks.map((id) => new Types.ObjectId(id));
  }
  await task.save();
  await task.populate("blockedBy", "title status");
  await task.populate("blocks", "title status");
  return task;
};

const setRecurrence = async (
  taskId: string,
  userId: string,
  recurrence: {
    freq: "daily" | "weekly" | "monthly";
    interval?: number;
    nextRunAt?: string;
    endAt?: string;
    enabled?: boolean;
  } | null,
) => {
  const task = await taskServices.getTaskById(taskId);
  if (!task.workspaceId) {
    throw new AppError(HttpStatus.BAD_REQUEST, "Workspace task required");
  }
  const role = await getMembershipRole(String(task.workspaceId), userId);
  if (!isManagerOrAbove(role)) {
    throw new AppError(
      HttpStatus.FORBIDDEN,
      "Only managers/admins can set recurrence",
    );
  }

  if (!recurrence) {
    task.recurrence = null;
  } else {
    task.recurrence = {
      freq: recurrence.freq,
      interval: recurrence.interval || 1,
      nextRunAt: recurrence.nextRunAt
        ? new Date(recurrence.nextRunAt)
        : task.dueDate || new Date(),
      endAt: recurrence.endAt ? new Date(recurrence.endAt) : null,
      enabled: recurrence.enabled !== false,
    };
  }
  await task.save();
  return task;
};

const setEstimate = async (
  taskId: string,
  userId: string,
  estimateHours: number | null,
) => {
  const task = await taskServices.getTaskById(taskId);
  if (task.workspaceId) {
    const role = await getMembershipRole(String(task.workspaceId), userId);
    assertCanEditTask(task, userId, role);
  }
  task.estimateHours = estimateHours;
  await task.save();
  return task;
};

const syncDueDateReminders = async (taskId: string) => {
  await reminderServices.scheduleDueRemindersForTask(taskId);
};

export const taskAdvancedServices = {
  advancedFilter,
  searchTasks,
  getTaskDetail,
  bulkUpdate,
  exportCsv,
  calendarTasks,
  setWatchers,
  setDependencies,
  setRecurrence,
  setEstimate,
  syncDueDateReminders,
};
