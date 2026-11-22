import HttpStatus from "http-status";
import { Types } from "mongoose";
import AppError from "../../erros/AppError";
import { ACTIVITY_ACTION } from "../../constants/workspace";
import { activityServices } from "../Activity/activity.service";
import { TaskModel } from "../Task/task.model";
import { UserModel } from "../User/user.model";
import { sendNotification } from "../Notification/notification.utils";
import { CommentModel } from "./comment.model";

/** Parse @email or @"Name" or bare emails after @ */
const extractMentionEmails = (body: string): string[] => {
  const matches = body.match(/@([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g) || [];
  return [...new Set(matches.map((m) => m.slice(1).toLowerCase()))];
};

const addComment = async (
  userId: string,
  taskId: string,
  body: string,
  mentionIds?: string[],
) => {
  const task = await TaskModel.findById(taskId);
  if (!task) {
    throw new AppError(HttpStatus.NOT_FOUND, "Task not found");
  }
  if (!task.workspaceId) {
    throw new AppError(
      HttpStatus.BAD_REQUEST,
      "Comments require a workspace-scoped task",
    );
  }

  const mentionEmails = extractMentionEmails(body);
  const mentionedUsers = mentionEmails.length
    ? await UserModel.find({
        email: { $in: mentionEmails },
        isDeleted: false,
      }).select("_id email")
    : [];

  const mentionObjectIds = [
    ...mentionedUsers.map((u) => u._id),
    ...(mentionIds || []).map((id) => new Types.ObjectId(id)),
  ];

  const uniqueMentionIds = [
    ...new Map(mentionObjectIds.map((id) => [String(id), id])).values(),
  ];

  const comment = await CommentModel.create({
    taskId,
    workspaceId: task.workspaceId,
    authorId: userId,
    body: body.trim(),
    mentions: uniqueMentionIds,
  });

  await activityServices.logActivity({
    workspaceId: task.workspaceId,
    actorId: userId,
    action: ACTIVITY_ACTION.comment_added,
    taskId,
    meta: { commentId: String(comment._id), mentions: uniqueMentionIds.length },
  });

  const notifyIds = new Set<string>();
  if (task.assigneeId && String(task.assigneeId) !== String(userId)) {
    notifyIds.add(String(task.assigneeId));
  }
  for (const id of uniqueMentionIds) {
    if (String(id) !== String(userId)) notifyIds.add(String(id));
  }
  for (const wid of task.watcherIds || []) {
    if (String(wid) !== String(userId)) notifyIds.add(String(wid));
  }

  await Promise.all(
    [...notifyIds].map((recipientId) =>
      sendNotification({
        recipientId,
        senderId: userId,
        type: uniqueMentionIds.some((m) => String(m) === recipientId)
          ? "comment"
          : "comment",
        title: uniqueMentionIds.some((m) => String(m) === recipientId)
          ? "You were mentioned in a comment"
          : "New comment on a task",
        message: body.slice(0, 120),
        data: { taskId, commentId: String(comment._id) },
      }).catch(() => undefined),
    ),
  );

  return comment.populate([
    { path: "authorId", select: "name email profileImage" },
    { path: "mentions", select: "name email profileImage" },
  ]);
};

const listComments = async (taskId: string) => {
  return CommentModel.find({ taskId, isDeleted: false })
    .populate("authorId", "name email profileImage")
    .populate("mentions", "name email profileImage")
    .sort({ createdAt: 1 });
};

const deleteComment = async (commentId: string, userId: string) => {
  const comment = await CommentModel.findById(commentId);
  if (!comment || comment.isDeleted) {
    throw new AppError(HttpStatus.NOT_FOUND, "Comment not found");
  }

  if (String(comment.authorId) !== String(userId)) {
    throw new AppError(
      HttpStatus.FORBIDDEN,
      "You can only delete your own comments",
    );
  }

  comment.isDeleted = true;
  await comment.save();
  return comment;
};

export const commentServices = {
  addComment,
  listComments,
  deleteComment,
};
