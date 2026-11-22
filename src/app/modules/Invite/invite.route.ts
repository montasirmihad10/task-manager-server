import express from "express";
import auth from "../../middlewares/auth";
import requireWorkspaceRole from "../../middlewares/requireWorkspaceRole";
import { attachWorkspaceFromInvite } from "../../middlewares/attachWorkspace";
import { WORKSPACE_ROLE } from "../../constants/workspace";
import { inviteControllers } from "./invite.controller";

const router = express.Router();

router.get("/token/:token", inviteControllers.preview);
router.post(
  "/token/:token/accept",
  auth("user", "admin", "super_admin"),
  inviteControllers.accept,
);

router.get(
  "/",
  auth("user", "admin", "super_admin"),
  requireWorkspaceRole(WORKSPACE_ROLE.admin, WORKSPACE_ROLE.manager),
  inviteControllers.list,
);

router.post(
  "/",
  auth("user", "admin", "super_admin"),
  requireWorkspaceRole(WORKSPACE_ROLE.admin, WORKSPACE_ROLE.manager),
  inviteControllers.create,
);

router.post(
  "/with-credentials",
  auth("user", "admin", "super_admin"),
  requireWorkspaceRole(WORKSPACE_ROLE.admin, WORKSPACE_ROLE.manager),
  inviteControllers.createWithCredentials,
);

router.delete(
  "/:inviteId",
  auth("user", "admin", "super_admin"),
  attachWorkspaceFromInvite,
  requireWorkspaceRole(WORKSPACE_ROLE.admin, WORKSPACE_ROLE.manager),
  inviteControllers.revoke,
);

export const InviteRoutes = router;
