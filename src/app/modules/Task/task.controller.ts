import HttpStatus from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { JwtPayload } from "../../interface/global";
import { activityServices } from "../Activity/activity.service";
import { commentControllers } from "../Comment/comment.controller";
import { subtaskControllers } from "../Subtask/subtask.controller";
import { TTaskStatus } from "./task.interface";
import { taskServices } from "./task.service";
import { taskAdvancedServices } from "./taskAdvanced.service";

const getParamId = (id: string | string[]): string =>
  Array.isArray(id) ? id[0] : id;

const actorId = (req: { user?: JwtPayload }) =>
  req.user?.user ? String(req.user.user) : undefined;

const createTask = catchAsync(async (req, res) => {
  const user = req.user as JwtPayload;
  const result = await taskServices.createTask({
    ...req.body,
    createdBy: req.body.createdBy || String(user.user),
    userEmail: req.body.userEmail || user.email,
  });

  sendResponse(res, {
    statusCode: HttpStatus.CREATED,
    success: true,
    message: "Task created successfully",
    data: result,
  });
});

const getTasks = catchAsync(async (req, res) => {
  const workspaceId = req.query.workspaceId as string | undefined;

  if (workspaceId) {
    const user = req.user as JwtPayload;
    const result = await taskServices.getWorkspaceTasks(
      workspaceId,
      String(user.user),
      {
        projectId: req.query.projectId as string | undefined,
        assigneeId: req.query.assigneeId as string | undefined,
        status: req.query.status as string | undefined,
        includeArchived: req.query.includeArchived === "true",
      },
    );

    sendResponse(res, {
      statusCode: HttpStatus.OK,
      success: true,
      message: "Workspace tasks retrieved successfully",
      data: result,
    });
    return;
  }

  const email = req.query.email as string | undefined;
  const result = await taskServices.getTasks(email);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Tasks retrieved successfully",
    data: result,
  });
});

const getTaskById = catchAsync(async (req, res) => {
  const result = await taskServices.getTaskById(getParamId(req.params.id));

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Task retrieved successfully",
    data: result,
  });
});

const updateTask = catchAsync(async (req, res) => {
  const user = req.user as JwtPayload;
  const result = await taskServices.updateTask(
    getParamId(req.params.id),
    req.body,
    actorId(req),
    user.role,
  );

  if (req.body.dueDate !== undefined) {
    await taskAdvancedServices.syncDueDateReminders(String(result._id));
  }

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Task updated successfully",
    data: result,
  });
});

const deleteTask = catchAsync(async (req, res) => {
  const user = req.user as JwtPayload;
  const result = await taskServices.deleteTask(
    getParamId(req.params.id),
    actorId(req),
    user.role,
  );

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Task deleted successfully",
    data: result,
  });
});

const archiveTask = catchAsync(async (req, res) => {
  const result = await taskServices.archiveTask(
    getParamId(req.params.id),
    actorId(req) as string,
  );

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Task archived successfully",
    data: result,
  });
});

const assignTask = catchAsync(async (req, res) => {
  const result = await taskServices.assignTask(
    getParamId(req.params.id),
    req.body.assigneeId,
    actorId(req) as string,
  );

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Task assigned successfully",
    data: result,
  });
});

const updateStatus = catchAsync(async (req, res) => {
  const user = req.user as JwtPayload;
  const result = await taskServices.updateTaskStatus(
    getParamId(req.params.id),
    req.body.status as TTaskStatus,
    actorId(req),
    user.role,
  );

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Task status updated successfully",
    data: result,
  });
});

const moveStatusForward = catchAsync(async (req, res) => {
  const user = req.user as JwtPayload;
  const result = await taskServices.moveStatusForward(
    getParamId(req.params.id),
    req.body.updateStatus as string | undefined,
    actorId(req),
    user.role,
  );

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Task moved forward successfully",
    data: result,
  });
});

const moveStatusBack = catchAsync(async (req, res) => {
  const user = req.user as JwtPayload;
  const result = await taskServices.moveStatusBack(
    getParamId(req.params.id),
    req.body.updateBackStatus as string | undefined,
    actorId(req),
    user.role,
  );

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Task moved back successfully",
    data: result,
  });
});

const getTaskStats = catchAsync(async (req, res) => {
  const email = req.query.email as string | undefined;
  const workspaceId = req.query.workspaceId as string | undefined;
  const result = await taskServices.getTaskStats(email, workspaceId);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Task stats retrieved successfully",
    data: result,
  });
});

const searchFilterTasks = catchAsync(async (req, res) => {
  const result = await taskServices.searchFilterTasks({
    status: req.query.status as string | undefined,
    title: req.query.title as string | undefined,
    email: req.query.email as string | undefined,
    workspaceId: req.query.workspaceId as string | undefined,
  });

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Filtered tasks retrieved successfully",
    data: result,
  });
});

const getTaskActivity = catchAsync(async (req, res) => {
  const result = await activityServices.getTaskActivity(
    getParamId(req.params.id),
  );

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Task activity retrieved successfully",
    data: result,
  });
});

const getTaskDetail = catchAsync(async (req, res) => {
  const user = req.user as JwtPayload;
  const result = await taskAdvancedServices.getTaskDetail(
    getParamId(req.params.id),
    String(user.user),
  );
  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Task detail retrieved",
    data: result,
  });
});

const searchTasks = catchAsync(async (req, res) => {
  const user = req.user as JwtPayload;
  const result = await taskAdvancedServices.searchTasks(
    String(req.query.workspaceId),
    String(user.user),
    String(req.query.q || ""),
  );
  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Search results",
    data: result,
  });
});

const advancedFilter = catchAsync(async (req, res) => {
  const user = req.user as JwtPayload;
  const result = await taskAdvancedServices.advancedFilter(
    String(req.query.workspaceId || req.body.workspaceId),
    String(user.user),
    { ...req.query, ...req.body },
  );
  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Filtered tasks",
    data: result,
  });
});

const bulkUpdate = catchAsync(async (req, res) => {
  const user = req.user as JwtPayload;
  const result = await taskAdvancedServices.bulkUpdate(
    req.body.workspaceId,
    String(user.user),
    user.role,
    req.body,
  );
  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Bulk update applied",
    data: result,
  });
});

const exportCsv = catchAsync(async (req, res) => {
  const user = req.user as JwtPayload;
  const csv = await taskAdvancedServices.exportCsv(
    String(req.query.workspaceId),
    String(user.user),
  );
  res.setHeader("Content-Type", "text/csv");
  res.setHeader(
    "Content-Disposition",
    'attachment; filename="tasks-export.csv"',
  );
  res.status(HttpStatus.OK).send(csv);
});

const calendar = catchAsync(async (req, res) => {
  const user = req.user as JwtPayload;
  const result = await taskAdvancedServices.calendarTasks(
    String(req.query.workspaceId),
    String(user.user),
    String(req.query.from),
    String(req.query.to),
  );
  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Calendar tasks",
    data: result,
  });
});

const setWatchers = catchAsync(async (req, res) => {
  const result = await taskAdvancedServices.setWatchers(
    getParamId(req.params.id),
    actorId(req) as string,
    req.body.watcherIds || [],
  );
  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Watchers updated",
    data: result,
  });
});

const setDependencies = catchAsync(async (req, res) => {
  const result = await taskAdvancedServices.setDependencies(
    getParamId(req.params.id),
    actorId(req) as string,
    req.body,
  );
  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Dependencies updated",
    data: result,
  });
});

const setRecurrence = catchAsync(async (req, res) => {
  const result = await taskAdvancedServices.setRecurrence(
    getParamId(req.params.id),
    actorId(req) as string,
    req.body.recurrence ?? null,
  );
  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Recurrence updated",
    data: result,
  });
});

const setEstimate = catchAsync(async (req, res) => {
  const result = await taskAdvancedServices.setEstimate(
    getParamId(req.params.id),
    actorId(req) as string,
    req.body.estimateHours ?? null,
  );
  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Estimate updated",
    data: result,
  });
});

export const taskControllers = {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  deleteTask,
  archiveTask,
  assignTask,
  updateStatus,
  moveStatusForward,
  moveStatusBack,
  getTaskStats,
  searchFilterTasks,
  getTaskActivity,
  getTaskDetail,
  searchTasks,
  advancedFilter,
  bulkUpdate,
  exportCsv,
  calendar,
  setWatchers,
  setDependencies,
  setRecurrence,
  setEstimate,
  addComment: commentControllers.addComment,
  listComments: commentControllers.listComments,
  deleteComment: commentControllers.deleteComment,
  listSubtasks: subtaskControllers.list,
  addSubtask: subtaskControllers.create,
  updateSubtask: subtaskControllers.update,
  deleteSubtask: subtaskControllers.remove,
};
