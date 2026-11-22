import HttpStatus from "http-status";
import AppError from "../../erros/AppError";
import { LabelModel } from "./label.model";

const listLabels = async (workspaceId: string) =>
  LabelModel.find({ workspaceId, isDeleted: false }).sort({ name: 1 });

const createLabel = async (
  workspaceId: string,
  payload: { name: string; color?: string },
) => {
  return LabelModel.create({
    workspaceId,
    name: payload.name.trim(),
    color: payload.color || "#c8f542",
  });
};

const updateLabel = async (
  id: string,
  payload: Partial<{ name: string; color: string }>,
) => {
  const label = await LabelModel.findOneAndUpdate(
    { _id: id, isDeleted: false },
    { $set: payload },
    { returnDocument: 'after' },
  );
  if (!label) throw new AppError(HttpStatus.NOT_FOUND, "Label not found");
  return label;
};

const deleteLabel = async (id: string) => {
  const label = await LabelModel.findById(id);
  if (!label || label.isDeleted) {
    throw new AppError(HttpStatus.NOT_FOUND, "Label not found");
  }
  label.isDeleted = true;
  await label.save();
  return label;
};

export const labelServices = {
  listLabels,
  createLabel,
  updateLabel,
  deleteLabel,
};
