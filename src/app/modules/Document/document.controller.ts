import HttpStatus from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { JwtPayload } from "../../interface/global";
import { documentServices } from "./document.service";

const getParam = (id: string | string[]) => (Array.isArray(id) ? id[0] : id);

const uploadDocument = catchAsync(async (req, res) => {
  const user = req.user as JwtPayload;
  const result = await documentServices.uploadDocument(
    String(user.user),
    {
      workspaceId: req.body.workspaceId,
      taskId: req.body.taskId,
      projectId: req.body.projectId,
      name: req.body.name,
    },
    req.file as Express.Multer.File,
  );

  sendResponse(res, {
    statusCode: HttpStatus.CREATED,
    success: true,
    message: "Document uploaded successfully",
    data: result,
  });
});

const listDocuments = catchAsync(async (req, res) => {
  const result = await documentServices.listDocuments({
    workspaceId: String(req.query.workspaceId),
    taskId: req.query.taskId as string | undefined,
    projectId: req.query.projectId as string | undefined,
  });

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Documents retrieved successfully",
    data: result,
  });
});

const getDocument = catchAsync(async (req, res) => {
  const result = await documentServices.getDocument(getParam(req.params.id));

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Document retrieved successfully",
    data: result,
  });
});

const deleteDocument = catchAsync(async (req, res) => {
  const user = req.user as JwtPayload;
  const result = await documentServices.deleteDocument(
    getParam(req.params.id),
    String(user.user),
  );

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Document deleted successfully",
    data: result,
  });
});

export const documentControllers = {
  uploadDocument,
  listDocuments,
  getDocument,
  deleteDocument,
};
