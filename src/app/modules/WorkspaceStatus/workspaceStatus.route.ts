import express from "express";
import auth from "../../middlewares/auth";
import requireWorkspaceRole from "../../middlewares/requireWorkspaceRole";
import { attachWorkspaceFromStatus } from "../../middlewares/attachWorkspace";
import { WORKSPACE_ROLE } from "../../constants/workspace";
import { workspaceStatusControllers } from "./workspaceStatus.controller";

const router = express.Router();

router.get(
  "/",
  auth("user", "admin", "super_admin"),
  requireWorkspaceRole(
    WORKSPACE_ROLE.admin,
    WORKSPACE_ROLE.manager,
    WORKSPACE_ROLE.member,
  ),
  workspaceStatusControllers.list,
);

router.post(
  "/",
  auth("user", "admin", "super_admin"),
  requireWorkspaceRole(WORKSPACE_ROLE.admin),
  workspaceStatusControllers.create,
);

router.patch(
  "/reorder",
  auth("user", "admin", "super_admin"),
  requireWorkspaceRole(WORKSPACE_ROLE.admin),
  workspaceStatusControllers.reorder,
);

router.patch(
  "/:id",
  auth("user", "admin", "super_admin"),
  attachWorkspaceFromStatus,
  requireWorkspaceRole(WORKSPACE_ROLE.admin),
  workspaceStatusControllers.update,
);

router.delete(
  "/:id",
  auth("user", "admin", "super_admin"),
  attachWorkspaceFromStatus,
  requireWorkspaceRole(WORKSPACE_ROLE.admin),
  workspaceStatusControllers.remove,
);

export const WorkspaceStatusRoutes = router;
