import HttpStatus from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { workspaceStatusServices } from "./workspaceStatus.service";

const getParam = (id: string | string[]) => (Array.isArray(id) ? id[0] : id);

const list = catchAsync(async (req, res) => {
  const result = await workspaceStatusServices.listStatuses(
    String(req.query.workspaceId || req.params.workspaceId),
  );
  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Statuses retrieved",
    data: result,
  });
});

const create = catchAsync(async (req, res) => {
  const result = await workspaceStatusServices.createStatus(
    req.body.workspaceId,
    req.body,
  );
  sendResponse(res, {
    statusCode: HttpStatus.CREATED,
    success: true,
    message: "Status created",
    data: result,
  });
});

const update = catchAsync(async (req, res) => {
  const result = await workspaceStatusServices.updateStatus(
    getParam(req.params.id),
    req.body,
  );
  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Status updated",
    data: result,
  });
});

const remove = catchAsync(async (req, res) => {
  const result = await workspaceStatusServices.deleteStatus(
    getParam(req.params.id),
  );
  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Status deleted",
    data: result,
  });
});

const reorder = catchAsync(async (req, res) => {
  const result = await workspaceStatusServices.reorderStatuses(
    req.body.workspaceId,
    req.body.orderedIds || [],
  );
  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Statuses reordered",
    data: result,
  });
});

export const workspaceStatusControllers = {
  list,
  create,
  update,
  remove,
  reorder,
};
