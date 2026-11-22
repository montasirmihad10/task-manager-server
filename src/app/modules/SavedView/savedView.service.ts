import HttpStatus from "http-status";
import AppError from "../../erros/AppError";
import { ISavedViewFilters, SavedViewModel } from "./savedView.model";

const listViews = async (workspaceId: string, userId: string) =>
  SavedViewModel.find({
    workspaceId,
    $or: [{ userId }, { isShared: true }],
  }).sort({ name: 1 });

const createView = async (
  workspaceId: string,
  userId: string,
  payload: { name: string; filters?: ISavedViewFilters; isShared?: boolean },
) =>
  SavedViewModel.create({
    workspaceId,
    userId,
    name: payload.name,
    filters: payload.filters || {},
    isShared: !!payload.isShared,
  });

const updateView = async (
  id: string,
  userId: string,
  payload: Partial<{
    name: string;
    filters: ISavedViewFilters;
    isShared: boolean;
  }>,
) => {
  const view = await SavedViewModel.findOneAndUpdate(
    { _id: id, userId },
    { $set: payload },
    { returnDocument: 'after' },
  );
  if (!view) throw new AppError(HttpStatus.NOT_FOUND, "Saved view not found");
  return view;
};

const deleteView = async (id: string, userId: string) => {
  const result = await SavedViewModel.deleteOne({ _id: id, userId });
  if (!result.deletedCount) {
    throw new AppError(HttpStatus.NOT_FOUND, "Saved view not found");
  }
  return { deleted: true };
};

export const savedViewServices = {
  listViews,
  createView,
  updateView,
  deleteView,
};
