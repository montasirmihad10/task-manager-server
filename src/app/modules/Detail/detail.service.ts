import { DetailModel } from "./detail.model";

const getAllDetails = async () => {
  return DetailModel.find().sort({ createdAt: -1 });
};

const createDetail = async (payload: Record<string, unknown>) => {
  return DetailModel.create(payload);
};

export const detailServices = {
  getAllDetails,
  createDetail,
};
