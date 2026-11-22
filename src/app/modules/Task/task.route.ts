import express from "express";
import auth from "../../middlewares/auth";
import requireWorkspaceRole from "../../middlewares/requireWorkspaceRole";
import { WORKSPACE_ROLE } from "../../constants/workspace";
import { taskControllers } from "./task.controller";

const router = express.Router();

router.get(
  "/stats",
  auth("user", "admin", "super_admin"),
  taskControllers.getTaskStats,
);
router.get(
  "/search-filter",
  auth("user", "admin", "super_admin"),
  taskControllers.searchFilterTasks,
);
router.get(
  "/search",
  auth("user", "admin", "super_admin"),
  requireWorkspaceRole(
    WORKSPACE_ROLE.admin,
    WORKSPACE_ROLE.manager,
    WORKSPACE_ROLE.member,
  ),
  taskControllers.searchTasks,
);
router.get(
  "/filter",
  auth("user", "admin", "super_admin"),
  requireWorkspaceRole(
    WORKSPACE_ROLE.admin,
    WORKSPACE_ROLE.manager,
    WORKSPACE_ROLE.member,
  ),
  taskControllers.advancedFilter,
);
router.post(
  "/filter",
  auth("user", "admin", "super_admin"),
  requireWorkspaceRole(
    WORKSPACE_ROLE.admin,
    WORKSPACE_ROLE.manager,
    WORKSPACE_ROLE.member,
  ),
  taskControllers.advancedFilter,
);
router.post(
  "/bulk",
  auth("user", "admin", "super_admin"),
  requireWorkspaceRole(WORKSPACE_ROLE.admin, WORKSPACE_ROLE.manager),
  taskControllers.bulkUpdate,
);
router.get(
  "/export.csv",
  auth("user", "admin", "super_admin"),
  requireWorkspaceRole(
    WORKSPACE_ROLE.admin,
    WORKSPACE_ROLE.manager,
    WORKSPACE_ROLE.member,
  ),
  taskControllers.exportCsv,
);
router.get(
  "/calendar",
  auth("user", "admin", "super_admin"),
  requireWorkspaceRole(
    WORKSPACE_ROLE.admin,
    WORKSPACE_ROLE.manager,
    WORKSPACE_ROLE.member,
  ),
  taskControllers.calendar,
);

router.patch(
  "/:id/status",
  auth("user", "admin", "super_admin"),
  taskControllers.updateStatus,
);
router.patch(
  "/:id/status/forward",
  auth("user", "admin", "super_admin"),
  taskControllers.moveStatusForward,
);
router.patch(
  "/:id/status/back",
  auth("user", "admin", "super_admin"),
  taskControllers.moveStatusBack,
);

router.patch(
  "/:id/assign",
  auth("user", "admin", "super_admin"),
  requireWorkspaceRole(WORKSPACE_ROLE.admin, WORKSPACE_ROLE.manager),
  taskControllers.assignTask,
);
router.patch(
  "/:id/archive",
  auth("user", "admin", "super_admin"),
  requireWorkspaceRole(WORKSPACE_ROLE.admin, WORKSPACE_ROLE.manager),
  taskControllers.archiveTask,
);
router.patch(
  "/:id/watchers",
  auth("user", "admin", "super_admin"),
  taskControllers.setWatchers,
);
router.patch(
  "/:id/dependencies",
  auth("user", "admin", "super_admin"),
  taskControllers.setDependencies,
);
router.patch(
  "/:id/recurrence",
  auth("user", "admin", "super_admin"),
  taskControllers.setRecurrence,
);
router.patch(
  "/:id/estimate",
  auth("user", "admin", "super_admin"),
  taskControllers.setEstimate,
);

router.get(
  "/:id/detail",
  auth("user", "admin", "super_admin"),
  taskControllers.getTaskDetail,
);
router.get(
  "/:id/activity",
  auth("user", "admin", "super_admin"),
  taskControllers.getTaskActivity,
);

router.get(
  "/:id/comments",
  auth("user", "admin", "super_admin"),
  taskControllers.listComments,
);
router.post(
  "/:id/comments",
  auth("user", "admin", "super_admin"),
  taskControllers.addComment,
);
router.delete(
  "/:id/comments/:commentId",
  auth("user", "admin", "super_admin"),
  taskControllers.deleteComment,
);

router.get(
  "/:id/subtasks",
  auth("user", "admin", "super_admin"),
  taskControllers.listSubtasks,
);
router.post(
  "/:id/subtasks",
  auth("user", "admin", "super_admin"),
  taskControllers.addSubtask,
);
router.patch(
  "/:id/subtasks/:subtaskId",
  auth("user", "admin", "super_admin"),
  taskControllers.updateSubtask,
);
router.delete(
  "/:id/subtasks/:subtaskId",
  auth("user", "admin", "super_admin"),
  taskControllers.deleteSubtask,
);

router.post("/", auth("user", "admin", "super_admin"), taskControllers.createTask);
router.get("/", auth("user", "admin", "super_admin"), taskControllers.getTasks);
router.get(
  "/:id",
  auth("user", "admin", "super_admin"),
  taskControllers.getTaskById,
);
router.patch(
  "/:id",
  auth("user", "admin", "super_admin"),
  taskControllers.updateTask,
);
router.delete(
  "/:id",
  auth("user", "admin", "super_admin"),
  taskControllers.deleteTask,
);

export const TaskRoutes = router;
