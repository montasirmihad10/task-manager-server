import HttpStatus from "http-status";
import AppError from "../../erros/AppError";
import { DEFAULT_WORKSPACE_STATUSES } from "../../constants/product";
import { WorkspaceStatusModel } from "./workspaceStatus.model";

const seedDefaultStatuses = async (workspaceId: string) => {
  const count = await WorkspaceStatusModel.countDocuments({
    workspaceId,
    isDeleted: false,
  });
  if (count > 0) return;

  await WorkspaceStatusModel.insertMany(
    DEFAULT_WORKSPACE_STATUSES.map((s) => ({
      workspaceId,
      key: s.key,
      label: s.label,
      color: s.color,
      order: s.order,
      isDone: s.key === "ready-to-launch",
      isDefault: true,
    })),
  );
};

const listStatuses = async (workspaceId: string) => {
  await seedDefaultStatuses(workspaceId);
  return WorkspaceStatusModel.find({
    workspaceId,
    isDeleted: false,
  }).sort({ order: 1 });
};

const createStatus = async (
  workspaceId: string,
  payload: { key: string; label: string; color?: string; order?: number },
) => {
  const key = payload.key
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]+/g, "-");

  const exists = await WorkspaceStatusModel.findOne({
    workspaceId,
    key,
    isDeleted: false,
  });
  if (exists) {
    throw new AppError(HttpStatus.CONFLICT, "Status key already exists");
  }

  const maxOrder = await WorkspaceStatusModel.findOne({ workspaceId })
    .sort({ order: -1 })
    .select("order")
    .lean();

  return WorkspaceStatusModel.create({
    workspaceId,
    key,
    label: payload.label,
    color: payload.color || "#8b95a1",
    order: payload.order ?? (maxOrder?.order ?? 0) + 1,
  });
};

const updateStatus = async (
  id: string,
  payload: Partial<{
    label: string;
    color: string;
    order: number;
    isDone: boolean;
  }>,
) => {
  const status = await WorkspaceStatusModel.findOneAndUpdate(
    { _id: id, isDeleted: false },
    { $set: payload },
    { returnDocument: 'after' },
  );
  if (!status) {
    throw new AppError(HttpStatus.NOT_FOUND, "Status not found");
  }
  return status;
};

const deleteStatus = async (id: string) => {
  const status = await WorkspaceStatusModel.findById(id);
  if (!status || status.isDeleted) {
    throw new AppError(HttpStatus.NOT_FOUND, "Status not found");
  }
  if (status.isDefault) {
    throw new AppError(
      HttpStatus.BAD_REQUEST,
      "Default statuses cannot be deleted; archive/hide via soft flags later",
    );
  }
  status.isDeleted = true;
  await status.save();
  return status;
};

const reorderStatuses = async (
  workspaceId: string,
  orderedIds: string[],
) => {
  await Promise.all(
    orderedIds.map((id, index) =>
      WorkspaceStatusModel.updateOne(
        { _id: id, workspaceId },
        { $set: { order: index } },
      ),
    ),
  );
  return listStatuses(workspaceId);
};

export const workspaceStatusServices = {
  seedDefaultStatuses,
  listStatuses,
  createStatus,
  updateStatus,
  deleteStatus,
  reorderStatuses,
};
