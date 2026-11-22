import express from "express";
import auth from "../../middlewares/auth";
import requireWorkspaceRole from "../../middlewares/requireWorkspaceRole";
import { attachWorkspaceFromSavedView } from "../../middlewares/attachWorkspace";
import { WORKSPACE_ROLE } from "../../constants/workspace";
import { savedViewControllers } from "./savedView.controller";

const router = express.Router();

router.get(
  "/",
  auth("user", "admin", "super_admin"),
  requireWorkspaceRole(
    WORKSPACE_ROLE.admin,
    WORKSPACE_ROLE.manager,
    WORKSPACE_ROLE.member,
  ),
  savedViewControllers.list,
);
router.post(
  "/",
  auth("user", "admin", "super_admin"),
  requireWorkspaceRole(
    WORKSPACE_ROLE.admin,
    WORKSPACE_ROLE.manager,
    WORKSPACE_ROLE.member,
  ),
  savedViewControllers.create,
);
router.patch(
  "/:id",
  auth("user", "admin", "super_admin"),
  attachWorkspaceFromSavedView,
  requireWorkspaceRole(
    WORKSPACE_ROLE.admin,
    WORKSPACE_ROLE.manager,
    WORKSPACE_ROLE.member,
  ),
  savedViewControllers.update,
);
router.delete(
  "/:id",
  auth("user", "admin", "super_admin"),
  attachWorkspaceFromSavedView,
  requireWorkspaceRole(
    WORKSPACE_ROLE.admin,
    WORKSPACE_ROLE.manager,
    WORKSPACE_ROLE.member,
  ),
  savedViewControllers.remove,
);

export const SavedViewRoutes = router;
