import HttpStatus from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { JwtPayload } from "../../interface/global";
import { TWorkspaceRole } from "../../constants/workspace";
import { activityServices } from "../Activity/activity.service";
import { workspaceServices } from "./workspace.service";

const getParam = (id: string | string[]) => (Array.isArray(id) ? id[0] : id);

const createWorkspace = catchAsync(async (req, res) => {
  const user = req.user as JwtPayload;
  const result = await workspaceServices.createWorkspace(
    String(user.user),
    req.body,
  );

  sendResponse(res, {
    statusCode: HttpStatus.CREATED,
    success: true,
    message: "Workspace created successfully",
    data: result,
  });
});

const listMyWorkspaces = catchAsync(async (req, res) => {
  const user = req.user as JwtPayload;
  const result = await workspaceServices.listMyWorkspaces(String(user.user));

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Workspaces retrieved successfully",
    data: result,
  });
});

const getWorkspace = catchAsync(async (req, res) => {
  const user = req.user as JwtPayload;
  const result = await workspaceServices.getWorkspaceById(
    getParam(req.params.id),
    String(user.user),
  );

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Workspace retrieved successfully",
    data: result,
  });
});

const updateWorkspace = catchAsync(async (req, res) => {
  const result = await workspaceServices.updateWorkspace(
    getParam(req.params.id),
    req.body,
  );

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Workspace updated successfully",
    data: result,
  });
});

const deleteWorkspace = catchAsync(async (req, res) => {
  const user = req.user as JwtPayload;
  const result = await workspaceServices.softDeleteWorkspace(
    getParam(req.params.id),
    String(user.user),
  );

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Workspace deleted successfully",
    data: result,
  });
});

const listMembers = catchAsync(async (req, res) => {
  const result = await workspaceServices.listMembers(
    getParam(req.params.id),
  );

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Members retrieved successfully",
    data: result,
  });
});

const inviteMember = catchAsync(async (req, res) => {
  const user = req.user as JwtPayload;
  const result = await workspaceServices.inviteMember(
    getParam(req.params.id),
    String(user.user),
    req.body,
  );

  sendResponse(res, {
    statusCode: HttpStatus.CREATED,
    success: true,
    message: "Member invited successfully",
    data: result,
  });
});

const updateMemberRole = catchAsync(async (req, res) => {
  const user = req.user as JwtPayload;
  const result = await workspaceServices.updateMemberRole(
    getParam(req.params.id),
    getParam(req.params.memberId),
    req.body.role as TWorkspaceRole,
    String(user.user),
  );

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Member role updated successfully",
    data: result,
  });
});

const removeMember = catchAsync(async (req, res) => {
  const user = req.user as JwtPayload;
  const result = await workspaceServices.removeMember(
    getParam(req.params.id),
    getParam(req.params.memberId),
    String(user.user),
  );

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Member removed successfully",
    data: result,
  });
});

const getActivity = catchAsync(async (req, res) => {
  const result = await activityServices.getWorkspaceActivity(
    getParam(req.params.id),
  );

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Workspace activity retrieved successfully",
    data: result,
  });
});

export const workspaceControllers = {
  createWorkspace,
  listMyWorkspaces,
  getWorkspace,
  updateWorkspace,
  deleteWorkspace,
  listMembers,
  inviteMember,
  updateMemberRole,
  removeMember,
  getActivity,
};
