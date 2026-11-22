import express from "express";
import auth from "../../middlewares/auth";
import validateRequest from "../../middlewares/validateRequest";
import requireWorkspaceRole from "../../middlewares/requireWorkspaceRole";
import { WORKSPACE_ROLE } from "../../constants/workspace";
import { projectControllers } from "./project.controller";
import {
  createProjectValidation,
  updateProjectValidation,
} from "./project.validation";

const router = express.Router();

router.post(
  "/",
  auth("user", "admin", "super_admin"),
  validateRequest(createProjectValidation),
  requireWorkspaceRole(WORKSPACE_ROLE.admin, WORKSPACE_ROLE.manager),
  projectControllers.createProject,
);

router.get(
  "/",
  auth("user", "admin", "super_admin"),
  requireWorkspaceRole(
    WORKSPACE_ROLE.admin,
    WORKSPACE_ROLE.manager,
    WORKSPACE_ROLE.member,
  ),
  projectControllers.listProjects,
);

router.get(
  "/:id",
  auth("user", "admin", "super_admin"),
  requireWorkspaceRole(
    WORKSPACE_ROLE.admin,
    WORKSPACE_ROLE.manager,
    WORKSPACE_ROLE.member,
  ),
  projectControllers.getProject,
);

router.patch(
  "/:id",
  auth("user", "admin", "super_admin"),
  requireWorkspaceRole(WORKSPACE_ROLE.admin, WORKSPACE_ROLE.manager),
  validateRequest(updateProjectValidation),
  projectControllers.updateProject,
);

router.delete(
  "/:id",
  auth("user", "admin", "super_admin"),
  requireWorkspaceRole(WORKSPACE_ROLE.admin),
  projectControllers.deleteProject,
);

export const ProjectRoutes = router;
