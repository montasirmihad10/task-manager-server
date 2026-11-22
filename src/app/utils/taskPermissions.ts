import HttpStatus from "http-status";
import AppError from "../erros/AppError";
import {
  MEMBERSHIP_STATUS,
  TWorkspaceRole,
  WORKSPACE_ROLE,
  WORKSPACE_ROLE_RANK,
} from "../constants/workspace";
import { WorkspaceMemberModel } from "../modules/Workspace/workspaceMember.model";
import { ITask } from "../modules/Task/task.interface";

export const getMembershipRole = async (
  workspaceId: string,
  userId: string,
): Promise<TWorkspaceRole | null> => {
  const m = await WorkspaceMemberModel.findOne({
    workspaceId,
    userId,
    status: MEMBERSHIP_STATUS.active,
  }).lean();
  return m?.role ?? null;
};

export const assertCanManageTasks = (role: TWorkspaceRole | null) => {
  if (!role || WORKSPACE_ROLE_RANK[role] < WORKSPACE_ROLE_RANK.manager) {
    throw new AppError(
      HttpStatus.FORBIDDEN,
      "Only managers and admins can manage or assign tasks",
    );
  }
};

/**
 * Members may edit only tasks assigned to them (or that they created).
 * Managers/admins may edit any workspace task.
 */
export const assertCanEditTask = (
  task: ITask,
  userId: string,
  role: TWorkspaceRole | null,
  platformRole?: string,
) => {
  if (platformRole === "super_admin") return;

  if (!task.workspaceId) {
    // Legacy email-scoped tasks: owner email match handled by callers
    return;
  }

  if (!role) {
    throw new AppError(HttpStatus.FORBIDDEN, "Not a workspace member");
  }

  if (WORKSPACE_ROLE_RANK[role] >= WORKSPACE_ROLE_RANK.manager) return;

  const isAssignee = task.assigneeId && String(task.assigneeId) === String(userId);
  const isCreator = task.createdBy && String(task.createdBy) === String(userId);

  if (!isAssignee && !isCreator) {
    throw new AppError(
      HttpStatus.FORBIDDEN,
      "Members can only edit tasks assigned to them",
    );
  }
};

export const assertCanAssign = (role: TWorkspaceRole | null) => {
  assertCanManageTasks(role);
};

export const isManagerOrAbove = (role: TWorkspaceRole | null) =>
  !!role && WORKSPACE_ROLE_RANK[role] >= WORKSPACE_ROLE_RANK.manager;

export { WORKSPACE_ROLE };
