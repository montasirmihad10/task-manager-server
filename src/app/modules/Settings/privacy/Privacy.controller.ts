import HttpStatus from "http-status";
import sendResponse from "../../../utils/sendResponse";
import { JwtPayload } from "../../../interface/global";
import { privacyServices } from "./Privacy.service";
import catchAsync from "../../../utils/catchAsync";
import { renderLegalHtmlPage } from "../../../utils/legalHtmlPage";

const createPrivacy = catchAsync(async (req, res) => {
  const result = await privacyServices.createPrivacy(
    req.body,
    req.user as JwtPayload,
  );

  sendResponse(res, {
    statusCode: HttpStatus.CREATED,
    success: true,
    message: "Privacy created successfully",
    data: result,
  });
});

const getAllPrivacy = catchAsync(async (req, res) => {
  const result = await privacyServices.getAllPrivacy();

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Privacy retrieved successfully",
    data: result,
  });
});

const updatePrivacy = catchAsync(async (req, res) => {
  const result = await privacyServices.updatePrivacy(
    req.body,
    req.user as JwtPayload,
  );

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Privacy updated successfully",
    data: result,
  });
});

const htmlRoute = catchAsync(async (_req, res) => {
  const privacy = await privacyServices.getPrivacyHtml();
  res.header("Content-Type", "text/html; charset=utf-8");
  res.header("Content-Security-Policy", "frame-ancestors *");
  res.removeHeader("X-Frame-Options");
  res.send(
    renderLegalHtmlPage({
      title: "Privacy Policy",
      bodyHtml: privacy.description,
    }),
  );
});

export const privacyControllers = {
  createPrivacy,
  getAllPrivacy,
  updatePrivacy,
  htmlRoute,
};
