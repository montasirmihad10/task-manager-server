import HttpStatus from "http-status";
import { NextFunction, Request, Response } from "express";
import catchAsync from "../utils/catchAsync";
import AppError from "../erros/AppError";
import {
  TWorkspaceRole,
  WORKSPACE_ROLE_RANK,
  MEMBERSHIP_STATUS,
} from "../constants/workspace";
import { WorkspaceMemberModel } from "../modules/Workspace/workspaceMember.model";
import { WorkspaceModel } from "../modules/Workspace/workspace.model";
import { TaskModel } from "../modules/Task/task.model";
import { ProjectModel } from "../modules/Project/project.model";

const resolveWorkspaceId = async (req: Request): Promise<string | null> => {
  if (req.params.workspaceId) return String(req.params.workspaceId);
  if (req.body?.workspaceId) return String(req.body.workspaceId);
  if (req.query?.workspaceId) return String(req.query.workspaceId);

  // Workspace routes use :id
  if (req.baseUrl.includes("/workspaces") && req.params.id) {
    return String(req.params.id);
  }

  // Task routes — resolve from task document
  if (req.params.taskId) {
    const task = await TaskModel.findById(req.params.taskId)
      .select("workspaceId")
      .lean();
    if (task?.workspaceId) return String(task.workspaceId);
  }

  if (req.baseUrl.includes("/tasks") && req.params.id) {
    const task = await TaskModel.findById(req.params.id)
      .select("workspaceId")
      .lean();
    if (task?.workspaceId) return String(task.workspaceId);
  }

  if (req.params.projectId) {
    const project = await ProjectModel.findById(req.params.projectId)
      .select("workspaceId")
      .lean();
    if (project?.workspaceId) return String(project.workspaceId);
  }

  if (req.baseUrl.includes("/projects") && req.params.id) {
    const project = await ProjectModel.findById(req.params.id)
      .select("workspaceId")
      .lean();
    if (project?.workspaceId) return String(project.workspaceId);
  }

  return null;
};

/**
 * Ensures the authenticated user is an active member of the workspace
 * with at least the minimum required role rank (admin > manager > member).
 * Platform super_admin bypasses membership checks.
 */
const requireWorkspaceRole = (...requiredRoles: TWorkspaceRole[]) => {
  return catchAsync(async (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user?.user) {
      throw new AppError(HttpStatus.UNAUTHORIZED, "Authentication required");
    }

    const workspaceId = await resolveWorkspaceId(req);

    if (req.user.role === "super_admin") {
      if (workspaceId) {
        req.workspace = {
          workspaceId,
          membershipId: "super_admin",
          role: "admin",
          userId: String(req.user.user),
        };
      }
      return next();
    }

    if (!workspaceId) {
      throw new AppError(
        HttpStatus.BAD_REQUEST,
        "workspaceId is required for this action",
      );
    }

    const workspace = await WorkspaceModel.findOne({
      _id: workspaceId,
      isDeleted: false,
    }).lean();

    if (!workspace) {
      throw new AppError(HttpStatus.NOT_FOUND, "Workspace not found");
    }

    const membership = await WorkspaceMemberModel.findOne({
      workspaceId,
      userId: req.user.user,
      status: MEMBERSHIP_STATUS.active,
    });

    if (!membership) {
      throw new AppError(
        HttpStatus.FORBIDDEN,
        "You are not a member of this workspace",
      );
    }

    if (requiredRoles.length) {
      const userRank = WORKSPACE_ROLE_RANK[membership.role];
      const allowed = requiredRoles.some(
        (r) => userRank >= WORKSPACE_ROLE_RANK[r],
      );

      if (!allowed) {
        throw new AppError(
          HttpStatus.FORBIDDEN,
          "Insufficient workspace permissions",
        );
      }
    }

    req.workspace = {
      workspaceId: String(workspaceId),
      membershipId: String(membership._id),
      role: membership.role,
      userId: String(req.user.user),
    };

    next();
  });
};

export default requireWorkspaceRole;
