import HttpStatus from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { JwtPayload } from "../../interface/global";
import { commentServices } from "./comment.service";

const getParam = (id: string | string[]) => (Array.isArray(id) ? id[0] : id);

const addComment = catchAsync(async (req, res) => {
  const user = req.user as JwtPayload;
  const result = await commentServices.addComment(
    String(user.user),
    getParam(req.params.id),
    req.body.body,
    req.body.mentionIds,
  );

  sendResponse(res, {
    statusCode: HttpStatus.CREATED,
    success: true,
    message: "Comment added successfully",
    data: result,
  });
});

const listComments = catchAsync(async (req, res) => {
  const result = await commentServices.listComments(getParam(req.params.id));

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Comments retrieved successfully",
    data: result,
  });
});

const deleteComment = catchAsync(async (req, res) => {
  const user = req.user as JwtPayload;
  const result = await commentServices.deleteComment(
    getParam(req.params.commentId),
    String(user.user),
  );

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Comment deleted successfully",
    data: result,
  });
});

export const commentControllers = {
  addComment,
  listComments,
  deleteComment,
};
