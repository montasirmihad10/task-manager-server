import HttpStatus from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { billingServices } from "./billing.service";

const getStatus = catchAsync(async (_req, res) => {
  const result = billingServices.getBillingStatus();
  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Billing status (free product)",
    data: result,
  });
});

const createCheckout = catchAsync(async (req, res) => {
  const result = await billingServices.createCheckoutSession(
    req.body.workspaceId,
    req.body.planId,
  );
  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Checkout stub",
    data: result,
  });
});

const webhook = catchAsync(async (req, res) => {
  const result = await billingServices.handleWebhook(
    req.body,
    req.headers["stripe-signature"] as string | undefined,
  );
  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Webhook stub",
    data: result,
  });
});

export const billingControllers = {
  getStatus,
  createCheckout,
  webhook,
};
