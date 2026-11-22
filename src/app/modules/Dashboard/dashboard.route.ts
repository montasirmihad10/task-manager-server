import express from "express";
import auth from "../../middlewares/auth";
import requireWorkspaceRole from "../../middlewares/requireWorkspaceRole";
import { WORKSPACE_ROLE } from "../../constants/workspace";
import { dashboardControllers } from "./dashboard.controller";

const router = express.Router();

router.get(
  "/me",
  auth("user", "admin", "super_admin"),
  dashboardControllers.mine,
);

router.get(
  "/workspace",
  auth("user", "admin", "super_admin"),
  requireWorkspaceRole(
    WORKSPACE_ROLE.admin,
    WORKSPACE_ROLE.manager,
    WORKSPACE_ROLE.member,
  ),
  dashboardControllers.workspaceSummary,
);

export const DashboardRoutes = router;
