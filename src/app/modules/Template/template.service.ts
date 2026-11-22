import HttpStatus from "http-status";
import AppError from "../../erros/AppError";
import { ProjectModel } from "../Project/project.model";
import { taskServices } from "../Task/task.service";
import { TemplateModel, TTemplateKind } from "./template.model";

const listTemplates = async (workspaceId: string, kind?: TTemplateKind) => {
  const filter: Record<string, unknown> = {
    workspaceId,
    isDeleted: false,
  };
  if (kind) filter.kind = kind;
  return TemplateModel.find(filter).sort({ name: 1 });
};

const createTemplate = async (
  userId: string,
  payload: {
    workspaceId: string;
    kind: TTemplateKind;
    name: string;
    description?: string;
    payload: Record<string, unknown>;
  },
) =>
  TemplateModel.create({
    workspaceId: payload.workspaceId,
    kind: payload.kind,
    name: payload.name,
    description: payload.description || "",
    payload: payload.payload,
    createdBy: userId,
  });

const applyTemplate = async (
  templateId: string,
  userId: string,
  userEmail: string,
  overrides: Record<string, unknown> = {},
) => {
  const template = await TemplateModel.findOne({
    _id: templateId,
    isDeleted: false,
  });
  if (!template) {
    throw new AppError(HttpStatus.NOT_FOUND, "Template not found");
  }

  const data = { ...template.payload, ...overrides };

  if (template.kind === "project") {
    return ProjectModel.create({
      workspaceId: template.workspaceId,
      name: String(data.name || template.name),
      description: String(data.description || ""),
      createdBy: userId,
    });
  }

  return taskServices.createTask({
    title: String(data.title || template.name),
    assignTo: String(data.assignTo || userEmail),
    start_date: String(data.start_date || new Date().toISOString().slice(0, 10)),
    end_date: String(data.end_date || new Date().toISOString().slice(0, 10)),
    userEmail,
    workspaceId: String(template.workspaceId),
    projectId: data.projectId ? String(data.projectId) : undefined,
    createdBy: userId,
    description: data.description ? String(data.description) : "",
    priority: data.priority as "low" | "medium" | "high" | "urgent" | undefined,
    status: data.status ? String(data.status) : "general",
    labels: Array.isArray(data.labels) ? (data.labels as string[]) : [],
  });
};

const deleteTemplate = async (id: string) => {
  const t = await TemplateModel.findById(id);
  if (!t || t.isDeleted) {
    throw new AppError(HttpStatus.NOT_FOUND, "Template not found");
  }
  t.isDeleted = true;
  await t.save();
  return t;
};

export const templateServices = {
  listTemplates,
  createTemplate,
  applyTemplate,
  deleteTemplate,
};
