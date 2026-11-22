import HttpStatus from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { JwtPayload } from "../../interface/global";
import { templateServices } from "./template.service";
import { TTemplateKind } from "./template.model";

const getParam = (id: string | string[]) => (Array.isArray(id) ? id[0] : id);

const list = catchAsync(async (req, res) => {
  const result = await templateServices.listTemplates(
    String(req.query.workspaceId),
    req.query.kind as TTemplateKind | undefined,
  );
  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Templates retrieved",
    data: result,
  });
});

const create = catchAsync(async (req, res) => {
  const user = req.user as JwtPayload;
  const result = await templateServices.createTemplate(String(user.user), {
    ...req.body,
    payload: req.body.payload || req.body.templatePayload || {},
  });
  sendResponse(res, {
    statusCode: HttpStatus.CREATED,
    success: true,
    message: "Template created",
    data: result,
  });
});

const apply = catchAsync(async (req, res) => {
  const user = req.user as JwtPayload;
  const result = await templateServices.applyTemplate(
    getParam(req.params.id),
    String(user.user),
    user.email,
    req.body.overrides || {},
  );
  sendResponse(res, {
    statusCode: HttpStatus.CREATED,
    success: true,
    message: "Template applied",
    data: result,
  });
});

const remove = catchAsync(async (req, res) => {
  const result = await templateServices.deleteTemplate(getParam(req.params.id));
  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Template deleted",
    data: result,
  });
});

export const templateControllers = { list, create, apply, remove };
