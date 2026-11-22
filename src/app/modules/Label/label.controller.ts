import HttpStatus from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { labelServices } from "./label.service";

const getParam = (id: string | string[]) => (Array.isArray(id) ? id[0] : id);

const list = catchAsync(async (req, res) => {
  const result = await labelServices.listLabels(String(req.query.workspaceId));
  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Labels retrieved",
    data: result,
  });
});

const create = catchAsync(async (req, res) => {
  const result = await labelServices.createLabel(req.body.workspaceId, req.body);
  sendResponse(res, {
    statusCode: HttpStatus.CREATED,
    success: true,
    message: "Label created",
    data: result,
  });
});

const update = catchAsync(async (req, res) => {
  const result = await labelServices.updateLabel(getParam(req.params.id), req.body);
  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Label updated",
    data: result,
  });
});

const remove = catchAsync(async (req, res) => {
  const result = await labelServices.deleteLabel(getParam(req.params.id));
  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Label deleted",
    data: result,
  });
});

export const labelControllers = { list, create, update, remove };
