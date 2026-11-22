import HttpStatus from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { JwtPayload } from "../../interface/global";
import { projectServices } from "./project.service";

const getParam = (id: string | string[]) => (Array.isArray(id) ? id[0] : id);

const createProject = catchAsync(async (req, res) => {
  const user = req.user as JwtPayload;
  const result = await projectServices.createProject(String(user.user), req.body);

  sendResponse(res, {
    statusCode: HttpStatus.CREATED,
    success: true,
    message: "Project created successfully",
    data: result,
  });
});

const listProjects = catchAsync(async (req, res) => {
  const workspaceId = (req.query.workspaceId ||
    req.body.workspaceId) as string;
  const result = await projectServices.listProjects(workspaceId);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Projects retrieved successfully",
    data: result,
  });
});

const getProject = catchAsync(async (req, res) => {
  const result = await projectServices.getProjectById(getParam(req.params.id));

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Project retrieved successfully",
    data: result,
  });
});

const updateProject = catchAsync(async (req, res) => {
  const user = req.user as JwtPayload;
  const result = await projectServices.updateProject(
    getParam(req.params.id),
    String(user.user),
    req.body,
  );

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Project updated successfully",
    data: result,
  });
});

const deleteProject = catchAsync(async (req, res) => {
  const user = req.user as JwtPayload;
  const result = await projectServices.deleteProject(
    getParam(req.params.id),
    String(user.user),
  );

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Project deleted successfully",
    data: result,
  });
});

export const projectControllers = {
  createProject,
  listProjects,
  getProject,
  updateProject,
  deleteProject,
};
