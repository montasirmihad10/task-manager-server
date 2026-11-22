import HttpStatus from "http-status";
import AppError from "../../erros/AppError";
import { ACTIVITY_ACTION } from "../../constants/workspace";
import { activityServices } from "../Activity/activity.service";
import { ProjectModel } from "./project.model";
import { TProjectStatus } from "./project.interface";

const createProject = async (
  userId: string,
  payload: { workspaceId: string; name: string; description?: string },
) => {
  const project = await ProjectModel.create({
    workspaceId: payload.workspaceId,
    name: payload.name,
    description: payload.description || "",
    createdBy: userId,
  });

  await activityServices.logActivity({
    workspaceId: payload.workspaceId,
    actorId: userId,
    action: ACTIVITY_ACTION.project_created,
    projectId: project._id,
    meta: { name: project.name },
  });

  return project;
};

const listProjects = async (workspaceId: string) => {
  return ProjectModel.find({
    workspaceId,
    isDeleted: false,
  }).sort({ createdAt: -1 });
};

const getProjectById = async (id: string) => {
  const project = await ProjectModel.findOne({ _id: id, isDeleted: false });
  if (!project) {
    throw new AppError(HttpStatus.NOT_FOUND, "Project not found");
  }
  return project;
};

const updateProject = async (
  id: string,
  userId: string,
  payload: {
    name?: string;
    description?: string;
    status?: TProjectStatus;
  },
) => {
  const project = await getProjectById(id);
  Object.assign(project, payload);
  await project.save();

  await activityServices.logActivity({
    workspaceId: project.workspaceId,
    actorId: userId,
    action: ACTIVITY_ACTION.project_updated,
    projectId: project._id,
    meta: payload,
  });

  return project;
};

const deleteProject = async (id: string, userId: string) => {
  const project = await getProjectById(id);
  project.isDeleted = true;
  project.status = "archived";
  await project.save();

  await activityServices.logActivity({
    workspaceId: project.workspaceId,
    actorId: userId,
    action: ACTIVITY_ACTION.project_updated,
    projectId: project._id,
    meta: { isDeleted: true },
  });

  return project;
};

export const projectServices = {
  createProject,
  listProjects,
  getProjectById,
  updateProject,
  deleteProject,
};
