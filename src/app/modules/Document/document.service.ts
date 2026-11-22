import HttpStatus from "http-status";
import AppError from "../../erros/AppError";
import { ACTIVITY_ACTION } from "../../constants/workspace";
import { sendFileToCloudinary } from "../../utils/sendImageToCloudinary";
import { activityServices } from "../Activity/activity.service";
import { TaskModel } from "../Task/task.model";
import { DocumentModel } from "./document.model";

const uploadDocument = async (
  userId: string,
  payload: {
    workspaceId: string;
    taskId?: string;
    projectId?: string;
    name?: string;
  },
  file: Express.Multer.File,
) => {
  if (!file) {
    throw new AppError(HttpStatus.BAD_REQUEST, "File is required");
  }

  const uploadResult = await sendFileToCloudinary(
    file.buffer,
    file.originalname,
    file.mimetype,
  );

  const doc = await DocumentModel.create({
    workspaceId: payload.workspaceId,
    taskId: payload.taskId || null,
    projectId: payload.projectId || null,
    uploadedBy: userId,
    name: payload.name || file.originalname,
    mimeType: file.mimetype,
    size: file.size || 0,
    url: uploadResult.secure_url,
    path: uploadResult.public_id || "",
  });

  if (payload.taskId) {
    await TaskModel.findByIdAndUpdate(payload.taskId, {
      $push: {
        attachments: {
          name: doc.name,
          url: doc.url,
          mimeType: doc.mimeType,
          size: doc.size,
          uploadedAt: new Date(),
        },
      },
    });
  }

  await activityServices.logActivity({
    workspaceId: payload.workspaceId,
    actorId: userId,
    action: ACTIVITY_ACTION.document_uploaded,
    taskId: payload.taskId,
    projectId: payload.projectId,
    documentId: doc._id,
    meta: { name: doc.name },
  });

  return doc;
};

const listDocuments = async (query: {
  workspaceId: string;
  taskId?: string;
  projectId?: string;
}) => {
  const filter: Record<string, unknown> = {
    workspaceId: query.workspaceId,
    isDeleted: false,
  };
  if (query.taskId) filter.taskId = query.taskId;
  if (query.projectId) filter.projectId = query.projectId;

  return DocumentModel.find(filter)
    .populate("uploadedBy", "name email")
    .sort({ createdAt: -1 });
};

const getDocument = async (id: string) => {
  const doc = await DocumentModel.findOne({ _id: id, isDeleted: false });
  if (!doc) {
    throw new AppError(HttpStatus.NOT_FOUND, "Document not found");
  }
  return doc;
};

const deleteDocument = async (id: string, userId: string) => {
  const doc = await getDocument(id);
  doc.isDeleted = true;
  await doc.save();

  await activityServices.logActivity({
    workspaceId: doc.workspaceId,
    actorId: userId,
    action: ACTIVITY_ACTION.document_deleted,
    taskId: doc.taskId,
    projectId: doc.projectId,
    documentId: doc._id,
    meta: { name: doc.name },
  });

  return doc;
};

export const documentServices = {
  uploadDocument,
  listDocuments,
  getDocument,
  deleteDocument,
};
