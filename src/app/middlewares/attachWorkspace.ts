import HttpStatus from "http-status";
import { NextFunction, Request, Response } from "express";
import catchAsync from "../utils/catchAsync";
import AppError from "../erros/AppError";
import { TemplateModel } from "../modules/Template/template.model";
import { WorkspaceInviteModel } from "../modules/Invite/invite.model";
import { WorkspaceStatusModel } from "../modules/WorkspaceStatus/workspaceStatus.model";
import { SavedViewModel } from "../modules/SavedView/savedView.model";

const getParam = (id: string | string[] | undefined) =>
  Array.isArray(id) ? id[0] : id;

/** Put workspaceId on body so requireWorkspaceRole can resolve it */
const setWorkspaceId = (req: Request, workspaceId: string) => {
  req.body = { ...(req.body || {}), workspaceId: String(workspaceId) };
};

export const attachWorkspaceFromTemplate = catchAsync(
  async (req: Request, _res: Response, next: NextFunction) => {
    const id = getParam(req.params.id);
    const doc = await TemplateModel.findById(id).select("workspaceId").lean();
    if (!doc) throw new AppError(HttpStatus.NOT_FOUND, "Template not found");
    setWorkspaceId(req, String(doc.workspaceId));
    next();
  },
);

export const attachWorkspaceFromInvite = catchAsync(
  async (req: Request, _res: Response, next: NextFunction) => {
    const id = getParam(req.params.inviteId);
    const doc = await WorkspaceInviteModel.findById(id)
      .select("workspaceId")
      .lean();
    if (!doc) throw new AppError(HttpStatus.NOT_FOUND, "Invite not found");
    setWorkspaceId(req, String(doc.workspaceId));
    next();
  },
);

export const attachWorkspaceFromStatus = catchAsync(
  async (req: Request, _res: Response, next: NextFunction) => {
    const id = getParam(req.params.id);
    const doc = await WorkspaceStatusModel.findById(id)
      .select("workspaceId")
      .lean();
    if (!doc) throw new AppError(HttpStatus.NOT_FOUND, "Status not found");
    setWorkspaceId(req, String(doc.workspaceId));
    next();
  },
);

export const attachWorkspaceFromSavedView = catchAsync(
  async (req: Request, _res: Response, next: NextFunction) => {
    const id = getParam(req.params.id);
    const doc = await SavedViewModel.findById(id).select("workspaceId").lean();
    if (!doc) throw new AppError(HttpStatus.NOT_FOUND, "Saved view not found");
    setWorkspaceId(req, String(doc.workspaceId));
    next();
  },
);
