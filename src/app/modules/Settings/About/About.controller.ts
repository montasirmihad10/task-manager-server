import HttpStatus from "http-status";
import catchAsync from "../../../utils/catchAsync";
import sendResponse from "../../../utils/sendResponse";
import { aboutServices } from "./About.service";
import { JwtPayload } from "../../../interface/global";
import { renderLegalHtmlPage } from "../../../utils/legalHtmlPage";

const createAbout = catchAsync(async (req, res) => {
  const result = await aboutServices.createAbout(
    req.body,
    req.user as JwtPayload,
  );
  sendResponse(res, {
    statusCode: HttpStatus.CREATED,
    success: true,
    message: "About created successfully",
    data: result,
  });
});

const getAllAbout = catchAsync(async (req, res) => {
  const result = await aboutServices.getAllAbout();
  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "About retrieved successfully",
    data: result,
  });
});

const updateAbout = catchAsync(async (req, res) => {
  const result = await aboutServices.updateAbout(
    req.body,
    req.user as JwtPayload,
  );
  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "About updated successfully",
    data: result,
  });
});

const htmlRoute = catchAsync(async (_req, res) => {
  const about = await aboutServices.getAboutHtml();
  res.header("Content-Type", "text/html; charset=utf-8");
  res.header("Content-Security-Policy", "frame-ancestors *");
  res.removeHeader("X-Frame-Options");
  res.send(
    renderLegalHtmlPage({
      title: "About Us",
      bodyHtml: about.description,
    }),
  );
});

export const aboutControllers = {
  createAbout,
  getAllAbout,
  updateAbout,
  htmlRoute,
};
