import {
  MEMBERSHIP_STATUS,
  TASK_PRIORITY,
  WORKSPACE_ROLE,
} from "../constants/workspace";
import config from "../config";
import { UserModel } from "../modules/User/user.model";
import { WorkspaceModel } from "../modules/Workspace/workspace.model";
import { WorkspaceMemberModel } from "../modules/Workspace/workspaceMember.model";
import { ProjectModel } from "../modules/Project/project.model";
import { TaskModel } from "../modules/Task/task.model";
import { LabelModel } from "../modules/Label/label.model";
import { SubtaskModel } from "../modules/Subtask/subtask.model";
import { CommentModel } from "../modules/Comment/comment.model";
import { NotificationModel } from "../modules/Notification/notification.model";
import { workspaceServices } from "../modules/Workspace/workspace.service";
import { workspaceStatusServices } from "../modules/WorkspaceStatus/workspaceStatus.service";

/** Shared password for seeded sample accounts */
export const SAMPLE_PASSWORD = "Planboard123!";

const TEAM_SLUG = "acme-product-team";
const TEAM_NAME = "Acme Product Team";

const adminEmail = () =>
  (config.ADMIN_EMAIL || "admin@gmail.com").toLowerCase().trim();
const adminPass = () => config.ADMIN_PASS || "123456";

type SeedUserDef = {
  email: string;
  name: string;
  role: "user" | "admin" | "super_admin";
  password: string;
  signupIntent: "manager" | "member";
  canManageTeam: boolean;
  /** Role inside the Acme team workspace; omit = not on team */
  teamRole?: (typeof WORKSPACE_ROLE)[keyof typeof WORKSPACE_ROLE];
};

export const getSampleUsers = (): SeedUserDef[] => [
  {
    email: adminEmail(),
    name: "Ada Admin",
    role: "admin",
    password: adminPass(),
    signupIntent: "manager",
    canManageTeam: true,
    teamRole: WORKSPACE_ROLE.admin,
  },
  {
    email: "manager@planboard.local",
    name: "Morgan Manager",
    role: "user",
    password: SAMPLE_PASSWORD,
    signupIntent: "manager",
    canManageTeam: true,
    // Owner of the team workspace (DB admin = UI Manager)
    teamRole: WORKSPACE_ROLE.admin,
  },
  {
    email: "member@planboard.local",
    name: "Mia Member",
    role: "user",
    password: SAMPLE_PASSWORD,
    signupIntent: "member",
    canManageTeam: false,
    teamRole: WORKSPACE_ROLE.member,
  },
  {
    email: "alex@planboard.local",
    name: "Alex Rivera",
    role: "user",
    password: SAMPLE_PASSWORD,
    signupIntent: "member",
    canManageTeam: false,
    teamRole: WORKSPACE_ROLE.member,
  },
  {
    // Dedicated solo member — personal workspace only, not on Acme team
    email: "solo@planboard.local",
    name: "Sam Solo",
    role: "user",
    password: SAMPLE_PASSWORD,
    signupIntent: "member",
    canManageTeam: false,
  },
];

async function upsertUser(opts: {
  email: string;
  name: string;
  role: "user" | "admin" | "super_admin";
  password: string;
  signupIntent: "manager" | "member";
  canManageTeam: boolean;
}) {
  const email = opts.email.toLowerCase().trim();
  let user = await UserModel.findOne({ email });

  if (!user) {
    user = await UserModel.create({
      email,
      name: opts.name,
      password: opts.password,
      role: opts.role,
      isVerified: true,
      isActive: true,
      isDeleted: false,
      signupIntent: opts.signupIntent,
      canManageTeam: opts.canManageTeam,
      mustChangePassword: false,
    });
    return user;
  }

  user.name = opts.name;
  user.role = opts.role;
  user.isVerified = true;
  user.isActive = true;
  user.isDeleted = false;
  user.signupIntent = opts.signupIntent;
  user.canManageTeam = opts.canManageTeam;
  user.mustChangePassword = false;
  user.password = opts.password; // pre-save hash
  await user.save();
  return user;
}

function daysFromNow(n: number) {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() + n);
  return d;
}

function ymd(d: Date) {
  return d.toISOString().slice(0, 10);
}

/**
 * Idempotent sample dataset for local testing:
 * - Manager owns Acme Product Team
 * - Members join that team
 * - Dedicated solo member stays on a personal board only
 * - Project, labels, tasks, subtasks, comments, inbox samples
 */
export const seedDemoData = async () => {
  try {
    const sampleUsers = getSampleUsers();
    const usersByEmail = new Map<
      string,
      Awaited<ReturnType<typeof upsertUser>>
    >();

    for (const u of sampleUsers) {
      const user = await upsertUser({
        email: u.email,
        name: u.name,
        role: u.role,
        password: u.password,
        signupIntent: u.signupIntent,
        canManageTeam: u.canManageTeam,
      });
      usersByEmail.set(u.email, user);
    }

    const admin = usersByEmail.get(adminEmail())!;
    const manager = usersByEmail.get("manager@planboard.local")!;
    const member = usersByEmail.get("member@planboard.local")!;
    const alex = usersByEmail.get("alex@planboard.local")!;
    const solo = usersByEmail.get("solo@planboard.local")!;

    // Personal boards first for members / solo (before joining the shared team)
    for (const email of [
      "member@planboard.local",
      "alex@planboard.local",
      "solo@planboard.local",
      adminEmail(),
    ]) {
      const user = usersByEmail.get(email);
      if (user) await workspaceServices.ensureDefaultWorkspace(user._id);
    }

    let workspace = await WorkspaceModel.findOne({
      slug: TEAM_SLUG,
      isDeleted: { $ne: true },
    });

    if (!workspace) {
      workspace = await WorkspaceModel.create({
        name: TEAM_NAME,
        slug: TEAM_SLUG,
        description:
          "Shared team board for managers and members — sample tasks across every status.",
        ownerId: manager._id,
        isPersonal: false,
      });
    } else {
      workspace.name = TEAM_NAME;
      workspace.description =
        "Shared team board for managers and members — sample tasks across every status.";
      workspace.ownerId = manager._id;
      workspace.isPersonal = false;
      await workspace.save();
    }

    await workspaceStatusServices.seedDefaultStatuses(String(workspace._id));

    // Sync team memberships (solo stays off this workspace)
    for (const u of sampleUsers) {
      if (!u.teamRole) continue;
      const user = usersByEmail.get(u.email)!;
      await WorkspaceMemberModel.findOneAndUpdate(
        { workspaceId: workspace._id, userId: user._id },
        {
          $set: {
            role: u.teamRole,
            status: MEMBERSHIP_STATUS.active,
            joinedAt: new Date(),
            invitedBy: manager._id,
          },
        },
        { upsert: true, returnDocument: "after" },
      );
    }

    // Manager’s default board is Acme (do not create a second empty team)
    await workspaceServices.ensureDefaultWorkspace(manager._id);

    // Ensure solo is NOT on the team workspace
    await WorkspaceMemberModel.deleteMany({
      workspaceId: workspace._id,
      userId: solo._id,
    });

    let project = await ProjectModel.findOne({
      workspaceId: workspace._id,
      name: "Launch Pipeline",
      isDeleted: false,
    });

    if (!project) {
      project = await ProjectModel.create({
        workspaceId: workspace._id,
        name: "Launch Pipeline",
        description: "Main project for the Acme team board",
        createdBy: manager._id,
        status: "active",
      });
    }

    const labelDefs = [
      { name: "Design", color: "#3d8fd1" },
      { name: "Backend", color: "#9bc41a" },
      { name: "Blocked", color: "#ff6b3d" },
    ];
    const labels = [];
    for (const l of labelDefs) {
      const doc = await LabelModel.findOneAndUpdate(
        { workspaceId: workspace._id, name: l.name, isDeleted: false },
        { $setOnInsert: { color: l.color } },
        { upsert: true, returnDocument: "after" },
      );
      labels.push(doc);
    }

    const existingWsTasks = await TaskModel.countDocuments({
      workspaceId: workspace._id,
      isArchived: { $ne: true },
    });

    if (existingWsTasks === 0) {
      const taskDefs = [
        {
          title: "Capture product kickoff notes",
          status: "general",
          assignee: manager,
          priority: TASK_PRIORITY.medium,
          dueOffset: 2,
          labels: [labels[0]?._id].filter(Boolean),
          description: "Collect goals and open questions from kickoff.",
        },
        {
          title: "Draft onboarding checklist",
          status: "general",
          assignee: member,
          priority: TASK_PRIORITY.low,
          dueOffset: 5,
          labels: [labels[0]?._id].filter(Boolean),
          description: "Help new members find the board and My work.",
        },
        {
          title: "Prioritize next milestones",
          status: "backlog",
          assignee: manager,
          priority: TASK_PRIORITY.high,
          dueOffset: 8,
          labels: [labels[1]?._id].filter(Boolean),
          description: "Rank themes for the next release.",
        },
        {
          title: "Define board status rules",
          status: "backlog",
          assignee: alex,
          priority: TASK_PRIORITY.medium,
          dueOffset: 4,
          labels: [],
          description: "Document when to move cards between columns.",
        },
        {
          title: "Build overview analytics cards",
          status: "in-progress",
          assignee: member,
          priority: TASK_PRIORITY.high,
          dueOffset: 1,
          labels: [labels[1]?._id].filter(Boolean),
          description: "Wire workspace summary into the overview page.",
        },
        {
          title: "Wire drag-and-drop status updates",
          status: "in-progress",
          assignee: alex,
          priority: TASK_PRIORITY.urgent,
          dueOffset: 0,
          labels: [labels[1]?._id, labels[2]?._id].filter(Boolean),
          description: "Board drag-and-drop should save status changes.",
        },
        {
          title: "Polish mobile sidebar drawer",
          status: "paused",
          assignee: manager,
          priority: TASK_PRIORITY.low,
          dueOffset: 12,
          labels: [labels[0]?._id].filter(Boolean),
          description: "Paused pending design review.",
        },
        {
          title: "Ship members directory table",
          status: "ready-to-launch",
          assignee: admin,
          priority: TASK_PRIORITY.medium,
          dueOffset: -2,
          labels: [],
          description: "Ready for a final check.",
        },
        {
          title: "Publish landing hero redesign",
          status: "ready-to-launch",
          assignee: alex,
          priority: TASK_PRIORITY.medium,
          dueOffset: 3,
          labels: [labels[0]?._id].filter(Boolean),
          description: "Illustration and board preview on the home page.",
        },
      ];

      for (const def of taskDefs) {
        const start = daysFromNow(def.dueOffset - 7);
        const end = daysFromNow(def.dueOffset);
        const due = daysFromNow(def.dueOffset);

        const task = await TaskModel.create({
          title: def.title,
          assignTo: def.assignee.name || def.assignee.email,
          status: def.status,
          start_date: ymd(start),
          end_date: ymd(end),
          userEmail: manager.email,
          email: manager.email,
          workspaceId: workspace._id,
          projectId: project._id,
          createdBy: manager._id,
          assigneeId: def.assignee._id,
          description: def.description,
          priority: def.priority,
          labelIds: def.labels,
          dueDate: due,
          isArchived: false,
        });

        await SubtaskModel.create([
          {
            taskId: task._id,
            workspaceId: workspace._id,
            title: "Write acceptance criteria",
            isDone: def.status === "ready-to-launch",
            order: 0,
          },
          {
            taskId: task._id,
            workspaceId: workspace._id,
            title: "Get a review",
            isDone: false,
            order: 1,
            assigneeId: manager._id,
          },
        ]);

        if (def.status === "in-progress") {
          await CommentModel.create({
            taskId: task._id,
            workspaceId: workspace._id,
            authorId: manager._id,
            body: `Looking good — @${member.email} can you take the next pass?`,
            mentions: [member._id],
          });
        }
      }
    }

    const sampleTask = await TaskModel.findOne({
      workspaceId: workspace._id,
    }).select("_id title");

    for (const u of [manager, member, alex, admin]) {
      const existingNotifs = await NotificationModel.countDocuments({
        recipient: u._id,
      });
      if (existingNotifs > 0) continue;

      await NotificationModel.create([
        {
          recipient: u._id,
          sender: manager._id,
          type: "task_assigned",
          title: "New task assigned",
          message: sampleTask
            ? `You were assigned: ${sampleTask.title}`
            : `A task was assigned to you in ${TEAM_NAME}`,
          data: {
            taskId: sampleTask?._id,
            workspaceId: workspace._id,
          },
          isRead: false,
        },
        {
          recipient: u._id,
          sender: manager._id,
          type: "comment",
          title: "New comment",
          message: "Morgan Manager left a comment on a task you’re watching",
          data: {
            taskId: sampleTask?._id,
            workspaceId: workspace._id,
          },
          isRead: false,
        },
        {
          recipient: u._id,
          sender: null,
          type: "system",
          title: "Welcome to Planboard",
          message:
            "The core product is free. Use Inbox for assignments, mentions, and reminders.",
          data: { workspaceId: workspace._id },
          isRead: true,
        },
      ]);
    }

    // Solo member gets a personal welcome only
    const soloNotifs = await NotificationModel.countDocuments({
      recipient: solo._id,
    });
    if (soloNotifs === 0) {
      await NotificationModel.create({
        recipient: solo._id,
        sender: null,
        type: "system",
        title: "Welcome to Planboard",
        message:
          "This is your personal board. When a manager invites you, you can join their team workspace.",
        data: {},
        isRead: false,
      });
    }

    // eslint-disable-next-line no-console
    console.log(`
────────────────────────────────────────
 Sample accounts (password reset on seed)
────────────────────────────────────────
  Platform admin
    ${admin.email}  /  ${adminPass()}

  Manager (owns “${TEAM_NAME}”)
    manager@planboard.local  /  ${SAMPLE_PASSWORD}

  Team members (under that manager)
    member@planboard.local   /  ${SAMPLE_PASSWORD}
    alex@planboard.local     /  ${SAMPLE_PASSWORD}

  Dedicated solo member (personal board only)
    solo@planboard.local     /  ${SAMPLE_PASSWORD}

  Workspace: “${TEAM_NAME}”
────────────────────────────────────────`);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Error seeding sample data:", error);
  }
};
