import HttpStatus from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { subtaskServices } from "./subtask.service";

const getParam = (id: string | string[]) => (Array.isArray(id) ? id[0] : id);

const list = catchAsync(async (req, res) => {
  const result = await subtaskServices.listSubtasks(getParam(req.params.id));
  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Subtasks retrieved",
    data: result,
  });
});

const create = catchAsync(async (req, res) => {
  const result = await subtaskServices.addSubtask(
    getParam(req.params.id),
    req.body,
  );
  sendResponse(res, {
    statusCode: HttpStatus.CREATED,
    success: true,
    message: "Subtask created",
    data: result,
  });
});

const update = catchAsync(async (req, res) => {
  const result = await subtaskServices.updateSubtask(
    getParam(req.params.subtaskId),
    req.body,
  );
  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Subtask updated",
    data: result,
  });
});

const remove = catchAsync(async (req, res) => {
  const result = await subtaskServices.deleteSubtask(
    getParam(req.params.subtaskId),
  );
  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Subtask deleted",
    data: result,
  });
});

export const subtaskControllers = { list, create, update, remove };
