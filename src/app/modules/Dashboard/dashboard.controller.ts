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
  const result = await dashboardServices.getWorkspaceSummary(
    String(req.query.workspaceId),
    String(user.user),
  );
  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Workspace summary retrieved",
    data: result,
  });
});

export const dashboardControllers = { mine, workspaceSummary };
