import express from "express";
import auth from "../../middlewares/auth";
import validateRequest from "../../middlewares/validateRequest";
import requireWorkspaceRole from "../../middlewares/requireWorkspaceRole";
import { WORKSPACE_ROLE } from "../../constants/workspace";
import { workspaceControllers } from "./workspace.controller";
import {
  createWorkspaceValidation,
  inviteMemberValidation,
  updateMemberRoleValidation,
  updateWorkspaceValidation,
} from "./workspace.validation";

const router = express.Router();

router.post(
  "/",
  auth("user", "admin", "super_admin"),
  validateRequest(createWorkspaceValidation),
  workspaceControllers.createWorkspace,
);

router.get(
  "/",
  auth("user", "admin", "super_admin"),
  workspaceControllers.listMyWorkspaces,
);

router.get(
  "/:id",
  auth("user", "admin", "super_admin"),
  requireWorkspaceRole(
    WORKSPACE_ROLE.admin,
    WORKSPACE_ROLE.manager,
    WORKSPACE_ROLE.member,
  ),
  workspaceControllers.getWorkspace,
);

router.patch(
  "/:id",
  auth("user", "admin", "super_admin"),
  requireWorkspaceRole(WORKSPACE_ROLE.admin),
  validateRequest(updateWorkspaceValidation),
  workspaceControllers.updateWorkspace,
);

router.delete(
  "/:id",
  auth("user", "admin", "super_admin"),
  requireWorkspaceRole(WORKSPACE_ROLE.admin),
  workspaceControllers.deleteWorkspace,
);

router.get(
  "/:id/members",
  auth("user", "admin", "super_admin"),
  requireWorkspaceRole(
    WORKSPACE_ROLE.admin,
    WORKSPACE_ROLE.manager,
    WORKSPACE_ROLE.member,
  ),
  workspaceControllers.listMembers,
);

router.post(
  "/:id/members",
  auth("user", "admin", "super_admin"),
  requireWorkspaceRole(WORKSPACE_ROLE.admin, WORKSPACE_ROLE.manager),
  validateRequest(inviteMemberValidation),
  workspaceControllers.inviteMember,
);

router.patch(
  "/:id/members/:memberId",
  auth("user", "admin", "super_admin"),
  requireWorkspaceRole(WORKSPACE_ROLE.admin),
  validateRequest(updateMemberRoleValidation),
  workspaceControllers.updateMemberRole,
);

router.delete(
  "/:id/members/:memberId",
  auth("user", "admin", "super_admin"),
  requireWorkspaceRole(WORKSPACE_ROLE.admin),
  workspaceControllers.removeMember,
);

router.get(
  "/:id/activity",
  auth("user", "admin", "super_admin"),
  requireWorkspaceRole(
    WORKSPACE_ROLE.admin,
    WORKSPACE_ROLE.manager,
    WORKSPACE_ROLE.member,
  ),
  workspaceControllers.getActivity,
);

export const WorkspaceRoutes = router;
