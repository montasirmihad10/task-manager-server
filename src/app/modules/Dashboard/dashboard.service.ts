import { Types } from "mongoose";
import { MEMBERSHIP_STATUS } from "../../constants/workspace";
import { TaskModel } from "../Task/task.model";
import { ProjectModel } from "../Project/project.model";
import { WorkspaceMemberModel } from "../Workspace/workspaceMember.model";
import { WorkspaceModel } from "../Workspace/workspace.model";
import { workspaceStatusServices } from "../WorkspaceStatus/workspaceStatus.service";

const getWorkspaceSummary = async (workspaceId: string, userId: string) => {
  const membership = await WorkspaceMemberModel.findOne({
    workspaceId,
    userId,
    status: MEMBERSHIP_STATUS.active,
  });
  if (!membership) {
    return null;
  }

  const workspace = await WorkspaceModel.findOne({
    _id: workspaceId,
    isDeleted: false,
  });

  const wid = new Types.ObjectId(workspaceId);
  const now = new Date();
  const week = new Date();
  week.setDate(week.getDate() + 7);

  const isMemberOnly = membership.role === "member";
  const scopeAssignee = isMemberOnly
    ? { assigneeId: new Types.ObjectId(userId) }
    : {};

  const [
    totalTasks,
    myTasks,
    overdue,
    dueThisWeek,
    projects,
    statuses,
    byStatus,
  ] = await Promise.all([
    TaskModel.countDocuments({ workspaceId: wid, isArchived: { $ne: true } }),
    TaskModel.countDocuments({
      workspaceId: wid,
      assigneeId: userId,
      isArchived: { $ne: true },
    }),
    TaskModel.countDocuments({
      workspaceId: wid,
      ...scopeAssignee,
      dueDate: { $lt: now },
      isArchived: { $ne: true },
      status: { $ne: "ready-to-launch" },
    }),
    TaskModel.countDocuments({
      workspaceId: wid,
      ...scopeAssignee,
      dueDate: { $gte: now, $lte: week },
      isArchived: { $ne: true },
    }),
    ProjectModel.countDocuments({ workspaceId: wid, isDeleted: false }),
    workspaceStatusServices.listStatuses(workspaceId),
    TaskModel.aggregate([
      { $match: { workspaceId: wid, isArchived: { $ne: true } } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),
  ]);

  return {
    workspace,
    membershipRole: membership.role,
    counts: {
      totalTasks,
      myTasks,
      overdue,
      dueThisWeek,
      projects,
    },
    statuses,
    byStatus,
  };
};

const getMyDashboard = async (userId: string) => {
  const memberships = await WorkspaceMemberModel.find({
    userId,
    status: MEMBERSHIP_STATUS.active,
  }).lean();

  const workspaceIds = memberships.map((m) => m.workspaceId);
  const workspaceDocs = await WorkspaceModel.find({
    _id: { $in: workspaceIds },
    isDeleted: false,
  }).lean();

  const byId = new Map(workspaceDocs.map((w) => [String(w._id), w]));

  const workspaces = memberships
    .map((m) => {
      const ws = byId.get(String(m.workspaceId));
      if (!ws) return null;
      return { ...ws, membershipRole: m.role };
    })
    .filter(Boolean);

  const myOpenTasks = await TaskModel.find({
    assigneeId: userId,
    isArchived: { $ne: true },
  })
    .sort({ dueDate: 1 })
    .limit(20)
    .populate("workspaceId", "name")
    .populate("projectId", "name");

  const first = workspaces[0] as { _id?: Types.ObjectId } | undefined;

  return {
    workspaces,
    myOpenTasks,
    defaultWorkspaceId: first?._id ? String(first._id) : null,
  };
};

export const dashboardServices = {
  getWorkspaceSummary,
  getMyDashboard,
};
