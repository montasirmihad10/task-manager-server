import HttpStatus from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { JwtPayload } from "../../interface/global";
import { landingServices } from "./landing.service";

const getLanding = catchAsync(async (_req, res) => {
  const result = await landingServices.getPublicLanding();
  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Landing content retrieved",
    data: result,
  });
});

const updateLanding = catchAsync(async (req, res) => {
  const user = req.user as JwtPayload;
  const result = await landingServices.updateLanding(
    req.body,
    String(user.user),
  );
  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Landing content updated",
    data: result,
  });
});

const uploadImage = catchAsync(async (req, res) => {
  const result = await landingServices.uploadSiteImage(req.file);
  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Image uploaded to Cloudinary",
    data: result,
  });
});

export const landingControllers = {
  getLanding,
  updateLanding,
  uploadImage,
};
