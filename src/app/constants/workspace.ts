export const WORKSPACE_ROLE = {
  admin: "admin",
  manager: "manager",
  member: "member",
} as const;

export type TWorkspaceRole = (typeof WORKSPACE_ROLE)[keyof typeof WORKSPACE_ROLE];

export const WORKSPACE_ROLES: TWorkspaceRole[] = [
  WORKSPACE_ROLE.admin,
  WORKSPACE_ROLE.manager,
  WORKSPACE_ROLE.member,
];

/** Role hierarchy: higher index = more power */
export const WORKSPACE_ROLE_RANK: Record<TWorkspaceRole, number> = {
  member: 1,
  manager: 2,
  admin: 3,
};

export const MEMBERSHIP_STATUS = {
  active: "active",
  invited: "invited",
  removed: "removed",
} as const;

export type TMembershipStatus =
  (typeof MEMBERSHIP_STATUS)[keyof typeof MEMBERSHIP_STATUS];

export const TASK_PRIORITY = {
  low: "low",
  medium: "medium",
  high: "high",
  urgent: "urgent",
} as const;

export type TTaskPriority = (typeof TASK_PRIORITY)[keyof typeof TASK_PRIORITY];

export const ACTIVITY_ACTION = {
  task_created: "task_created",
  task_updated: "task_updated",
  task_assigned: "task_assigned",
  task_status_changed: "task_status_changed",
  task_archived: "task_archived",
  comment_added: "comment_added",
  document_uploaded: "document_uploaded",
  document_deleted: "document_deleted",
  member_invited: "member_invited",
  member_role_changed: "member_role_changed",
  project_created: "project_created",
  project_updated: "project_updated",
} as const;

export type TActivityAction =
  (typeof ACTIVITY_ACTION)[keyof typeof ACTIVITY_ACTION];
