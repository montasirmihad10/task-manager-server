import HttpStatus from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { detailServices } from "./detail.service";

const getAllDetails = catchAsync(async (_req, res) => {
  const result = await detailServices.getAllDetails();

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Details retrieved successfully",
    data: result,
  });
});

const createDetail = catchAsync(async (req, res) => {
  const result = await detailServices.createDetail(req.body);

  sendResponse(res, {
    statusCode: HttpStatus.CREATED,
    success: true,
    message: "Detail created successfully",
    data: result,
  });
});

export const detailControllers = {
  getAllDetails,
  createDetail,
};
