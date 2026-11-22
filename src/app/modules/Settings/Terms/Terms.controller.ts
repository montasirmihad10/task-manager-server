import HttpStatus from "http-status";
import catchAsync from "../../../utils/catchAsync";
import sendResponse from "../../../utils/sendResponse";
import { termsServices } from "./Terms.service";
import { JwtPayload } from "../../../interface/global";
import { renderLegalHtmlPage } from "../../../utils/legalHtmlPage";

const createTerms = catchAsync(async (req, res) => {
  const result = await termsServices.createTerms(
    req.body,
    req.user as JwtPayload,
  );
  sendResponse(res, {
    statusCode: HttpStatus.CREATED,
    success: true,
    message: "Terms created successfully",
    data: result,
  });
});

const getAllTerms = catchAsync(async (req, res) => {
  const result = await termsServices.getAllTerms();
  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Terms retrieved successfully",
    data: result,
  });
});

const updateTerms = catchAsync(async (req, res) => {
  const result = await termsServices.updateTerms(
    req.body,
    req.user as JwtPayload,
  );
  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Terms updated successfully",
    data: result,
  });
});

const htmlRoute = catchAsync(async (_req, res) => {
  const terms = await termsServices.getTermsHtml();
  res.header("Content-Type", "text/html; charset=utf-8");
  res.header("Content-Security-Policy", "frame-ancestors *");
  res.removeHeader("X-Frame-Options");
  res.send(
    renderLegalHtmlPage({
      title: "Terms and Conditions",
      bodyHtml: terms.description,
    }),
  );
});

export const termsControllers = {
  createTerms,
  getAllTerms,
  updateTerms,
  htmlRoute,
};
