import express, { NextFunction, Request, Response } from "express";
import auth from "../../middlewares/auth";
import requireWorkspaceRole from "../../middlewares/requireWorkspaceRole";
import { WORKSPACE_ROLE } from "../../constants/workspace";
import { upload } from "../../utils/sendImageToCloudinary";
import { documentControllers } from "./document.controller";
import { DocumentModel } from "./document.model";
import AppError from "../../erros/AppError";
import HttpStatus from "http-status";
import catchAsync from "../../utils/catchAsync";

const router = express.Router();

const attachWorkspaceFromDoc = catchAsync(
  async (req: Request, _res: Response, next: NextFunction) => {
    if (!req.params.id) return next();
    const doc = await DocumentModel.findById(req.params.id)
      .select("workspaceId")
      .lean();
    if (!doc) {
      throw new AppError(HttpStatus.NOT_FOUND, "Document not found");
    }
    req.body.workspaceId = String(doc.workspaceId);
    next();
  },
);

router.post(
  "/",
  auth("user", "admin", "super_admin"),
  upload.single("file"),
  (req: Request, _res: Response, next: NextFunction) => {
    if (req.body?.data) {
      try {
        const parsed = JSON.parse(req.body.data);
        req.body = { ...req.body, ...parsed };
      } catch {
        // keep body as-is
      }
    }
    next();
  },
  requireWorkspaceRole(
    WORKSPACE_ROLE.admin,
    WORKSPACE_ROLE.manager,
    WORKSPACE_ROLE.member,
  ),
  documentControllers.uploadDocument,
);

router.get(
  "/",
  auth("user", "admin", "super_admin"),
  requireWorkspaceRole(
    WORKSPACE_ROLE.admin,
    WORKSPACE_ROLE.manager,
    WORKSPACE_ROLE.member,
  ),
  documentControllers.listDocuments,
);

router.get(
  "/:id",
  auth("user", "admin", "super_admin"),
  attachWorkspaceFromDoc,
  requireWorkspaceRole(
    WORKSPACE_ROLE.admin,
    WORKSPACE_ROLE.manager,
    WORKSPACE_ROLE.member,
  ),
  documentControllers.getDocument,
);

router.delete(
  "/:id",
  auth("user", "admin", "super_admin"),
  attachWorkspaceFromDoc,
  requireWorkspaceRole(WORKSPACE_ROLE.admin, WORKSPACE_ROLE.manager),
  documentControllers.deleteDocument,
);

export const DocumentRoutes = router;
