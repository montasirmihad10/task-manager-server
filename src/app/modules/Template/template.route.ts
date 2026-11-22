import express from "express";
import auth from "../../middlewares/auth";
import requireWorkspaceRole from "../../middlewares/requireWorkspaceRole";
import { attachWorkspaceFromTemplate } from "../../middlewares/attachWorkspace";
import { WORKSPACE_ROLE } from "../../constants/workspace";
import { templateControllers } from "./template.controller";

const router = express.Router();

router.get(
  "/",
  auth("user", "admin", "super_admin"),
  requireWorkspaceRole(
    WORKSPACE_ROLE.admin,
    WORKSPACE_ROLE.manager,
    WORKSPACE_ROLE.member,
  ),
  templateControllers.list,
);
router.post(
  "/",
  auth("user", "admin", "super_admin"),
  requireWorkspaceRole(WORKSPACE_ROLE.admin, WORKSPACE_ROLE.manager),
  templateControllers.create,
);
router.post(
  "/:id/apply",
  auth("user", "admin", "super_admin"),
  attachWorkspaceFromTemplate,
  requireWorkspaceRole(WORKSPACE_ROLE.admin, WORKSPACE_ROLE.manager),
  templateControllers.apply,
);
router.delete(
  "/:id",
  auth("user", "admin", "super_admin"),
  attachWorkspaceFromTemplate,
  requireWorkspaceRole(WORKSPACE_ROLE.admin, WORKSPACE_ROLE.manager),
  templateControllers.remove,
);

export const TemplateRoutes = router;
