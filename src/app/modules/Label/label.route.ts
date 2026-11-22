import express from "express";
import auth from "../../middlewares/auth";
import requireWorkspaceRole from "../../middlewares/requireWorkspaceRole";
import { WORKSPACE_ROLE } from "../../constants/workspace";
import { labelControllers } from "./label.controller";
import { LabelModel } from "./label.model";
import catchAsync from "../../utils/catchAsync";
import AppError from "../../erros/AppError";
import HttpStatus from "http-status";

const router = express.Router();

const attachFromLabel = catchAsync(async (req, _res, next) => {
  const label = await LabelModel.findById(req.params.id).select("workspaceId");
  if (!label) throw new AppError(HttpStatus.NOT_FOUND, "Label not found");
  req.body.workspaceId = String(label.workspaceId);
  next();
});

router.get(
  "/",
  auth("user", "admin", "super_admin"),
  requireWorkspaceRole(
    WORKSPACE_ROLE.admin,
    WORKSPACE_ROLE.manager,
    WORKSPACE_ROLE.member,
  ),
  labelControllers.list,
);
router.post(
  "/",
  auth("user", "admin", "super_admin"),
  requireWorkspaceRole(WORKSPACE_ROLE.admin, WORKSPACE_ROLE.manager),
  labelControllers.create,
);
router.patch(
  "/:id",
  auth("user", "admin", "super_admin"),
  attachFromLabel,
  requireWorkspaceRole(WORKSPACE_ROLE.admin, WORKSPACE_ROLE.manager),
  labelControllers.update,
);
router.delete(
  "/:id",
  auth("user", "admin", "super_admin"),
  attachFromLabel,
  requireWorkspaceRole(WORKSPACE_ROLE.admin, WORKSPACE_ROLE.manager),
  labelControllers.remove,
);

export const LabelRoutes = router;
