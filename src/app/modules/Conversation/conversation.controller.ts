import HttpStatus from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { conversationServices } from "./conversation.service";
import { JwtPayload } from "../../interface/global";

const createOrGetConversation = catchAsync(async (req, res) => {
  const recipientId = req.body.recipientId || req.body.participantId;
  const workspaceId = req.body.workspaceId as string | undefined;
  const result = await conversationServices.createOrGetConversation(
    req.user as JwtPayload,
    recipientId,
    workspaceId,
  );

  sendResponse(res, {
    statusCode: HttpStatus.CREATED,
    success: true,
    message: "Conversation ready",
    data: result,
  });
});

const ensureWorkspaceChannels = catchAsync(async (req, res) => {
  const workspaceId = (req.body.workspaceId || req.query.workspaceId) as string;
  const result = await conversationServices.ensureWorkspaceChannels(
    req.user as JwtPayload,
    workspaceId,
  );

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Workspace chat channels ready",
    data: result,
  });
});

const getMyConversations = catchAsync(async (req, res) => {
  const result = await conversationServices.getMyConversations(
    req.user as JwtPayload,
    req.query,
  );

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Conversations retrieved successfully",
    meta: result.meta,
    data: result.result,
  });
});

const getConversationById = catchAsync(async (req, res) => {
  const result = await conversationServices.getConversationById(
    req.user as JwtPayload,
    req.params.id as string,
  );

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Conversation retrieved successfully",
    data: result,
  });
});

const deleteConversation = catchAsync(async (req, res) => {
  await conversationServices.deleteConversation(
    req.user as JwtPayload,
    req.params.id as string,
  );

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Conversation deleted successfully",
    data: null,
  });
});

export const conversationControllers = {
  createOrGetConversation,
  ensureWorkspaceChannels,
  getMyConversations,
  getConversationById,
  deleteConversation,
};
