import HttpStatus from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { JwtPayload } from "../../interface/global";
import { dashboardServices } from "./dashboard.service";

const mine = catchAsync(async (req, res) => {
  const user = req.user as JwtPayload;
  const result = await dashboardServices.getMyDashboard(String(user.user));
  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Dashboard retrieved",
    data: result,
  });
});

const workspaceSummary = catchAsync(async (req, res) => {
  const user = req.user as JwtPayload;
  const isPlatformAdmin =
    user.role === "admin" || user.role === "super_admin";
  const result = await dashboardServices.getWorkspaceSummary(
    String(req.query.workspaceId),
    String(user.user),
    { platformAdmin: isPlatformAdmin },
  );
  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Workspace summary retrieved",
    data: result,
  });
});

const platformSummary = catchAsync(async (req, res) => {
  const user = req.user as JwtPayload;
  if (user.role !== "admin" && user.role !== "super_admin") {
    return sendResponse(res, {
      statusCode: HttpStatus.FORBIDDEN,
      success: false,
      message: "Platform summary is restricted to administrators",
      data: null,
    });
  }
  const result = await dashboardServices.getPlatformSummary();
  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Platform summary retrieved",
    data: result,
  });
});

export const dashboardControllers = {
  mine,
  workspaceSummary,
  platformSummary,
};
