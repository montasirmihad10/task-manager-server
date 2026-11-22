import HttpStatus from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { JwtPayload } from "../../interface/global";
import { savedViewServices } from "./savedView.service";

const getParam = (id: string | string[]) => (Array.isArray(id) ? id[0] : id);

const list = catchAsync(async (req, res) => {
  const user = req.user as JwtPayload;
  const result = await savedViewServices.listViews(
    String(req.query.workspaceId),
    String(user.user),
  );
  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Saved views retrieved",
    data: result,
  });
});

const create = catchAsync(async (req, res) => {
  const user = req.user as JwtPayload;
  const result = await savedViewServices.createView(
    req.body.workspaceId,
    String(user.user),
    req.body,
  );
  sendResponse(res, {
    statusCode: HttpStatus.CREATED,
    success: true,
    message: "Saved view created",
    data: result,
  });
});

const update = catchAsync(async (req, res) => {
  const user = req.user as JwtPayload;
  const result = await savedViewServices.updateView(
    getParam(req.params.id),
    String(user.user),
    req.body,
  );
  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Saved view updated",
    data: result,
  });
});

const remove = catchAsync(async (req, res) => {
  const user = req.user as JwtPayload;
  const result = await savedViewServices.deleteView(
    getParam(req.params.id),
    String(user.user),
  );
  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Saved view deleted",
    data: result,
  });
});

export const savedViewControllers = { list, create, update, remove };
