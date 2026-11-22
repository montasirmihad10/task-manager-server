import { Types } from "mongoose";
import { MEMBERSHIP_STATUS } from "../../constants/workspace";
import { TaskModel } from "../Task/task.model";
import { ProjectModel } from "../Project/project.model";
import { WorkspaceMemberModel } from "../Workspace/workspaceMember.model";
import { WorkspaceModel } from "../Workspace/workspace.model";
import { UserModel } from "../User/user.model";
import { workspaceStatusServices } from "../WorkspaceStatus/workspaceStatus.service";
import { TASK_STATUSES } from "../Task/task.interface";

const mapStatusCounts = (
  rows: Array<{ _id: string; count: number }>,
) => {
  const byId = new Map(rows.map((r) => [String(r._id), r.count]));
  return TASK_STATUSES.map((status) => ({
    _id: status,
    count: byId.get(status) || 0,
  }));
};

/** Platform admin / super_admin — aggregate across the whole product. */
const getPlatformSummary = async () => {
  const now = new Date();
  const week = new Date();
  week.setDate(week.getDate() + 7);

  const [
    totalTasks,
    overdue,
    dueThisWeek,
    projects,
    workspaces,
    users,
    activeMemberships,
    byStatus,
  ] = await Promise.all([
    TaskModel.countDocuments({ isArchived: { $ne: true } }),
    TaskModel.countDocuments({
      isArchived: { $ne: true },
      dueDate: { $lt: now },
      status: { $ne: "ready-to-launch" },
    }),
    TaskModel.countDocuments({
      isArchived: { $ne: true },
      dueDate: { $gte: now, $lte: week },
    }),
    ProjectModel.countDocuments({ isDeleted: false }),
    WorkspaceModel.countDocuments({ isDeleted: false }),
    UserModel.countDocuments({ isDeleted: false }),
    WorkspaceMemberModel.countDocuments({
      status: MEMBERSHIP_STATUS.active,
    }),
    TaskModel.aggregate([
      { $match: { isArchived: { $ne: true } } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),
  ]);

  return {
    scope: "platform" as const,
    counts: {
      totalTasks,
      overdue,
      dueThisWeek,
      projects,
      workspaces,
      users,
      activeMemberships,
      myTasks: totalTasks,
    },
    byStatus: mapStatusCounts(byStatus),
  };
};

const getWorkspaceSummary = async (
  workspaceId: string,
  userId: string,
  opts?: { platformAdmin?: boolean },
) => {
  const membership = await WorkspaceMemberModel.findOne({
    workspaceId,
    userId,
    status: MEMBERSHIP_STATUS.active,
  });

  if (!membership && !opts?.platformAdmin) {
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

  const isMemberOnly = membership?.role === "member" && !opts?.platformAdmin;
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
    scope: "workspace" as const,
    workspace,
    membershipRole: membership?.role || "admin",
    counts: {
      totalTasks,
      myTasks,
      overdue,
      dueThisWeek,
      projects,
    },
    statuses,
    byStatus: mapStatusCounts(byStatus),
  };
};

const getMyDashboard = async (userId: string) => {
  const user = await UserModel.findById(userId).select("role");
  const isPlatformAdmin =
    user?.role === "admin" || user?.role === "super_admin";

  if (isPlatformAdmin) {
    const platform = await getPlatformSummary();
    const workspaceDocs = await WorkspaceModel.find({ isDeleted: false })
      .sort({ isPersonal: 1, name: 1 })
      .lean();
    return {
      scope: "platform" as const,
      workspaces: workspaceDocs.map((w) => ({
        ...w,
        membershipRole: "admin",
      })),
      myOpenTasks: await TaskModel.find({ isArchived: { $ne: true } })
        .sort({ dueDate: 1 })
        .limit(20)
        .populate("workspaceId", "name")
        .populate("projectId", "name"),
      defaultWorkspaceId: workspaceDocs[0]?._id
        ? String(workspaceDocs[0]._id)
        : null,
      platform,
    };
  }

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
    scope: "member" as const,
    workspaces,
    myOpenTasks,
    defaultWorkspaceId: first?._id ? String(first._id) : null,
  };
};

export const dashboardServices = {
  getWorkspaceSummary,
  getMyDashboard,
  getPlatformSummary,
};
