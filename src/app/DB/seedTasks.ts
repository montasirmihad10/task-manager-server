import { TaskModel } from "../modules/Task/task.model";
import { UserModel } from "../modules/User/user.model";
import config from "../config";
import { TTaskStatus } from "../modules/Task/task.interface";

type SeedTask = {
  title: string;
  assignTo: string;
  status: TTaskStatus;
  start_date: string;
  end_date: string;
};

const SAMPLE_TASKS: SeedTask[] = [
  {
    title: "Capture product kickoff notes",
    assignTo: "Alex Rivera",
    status: "general",
    start_date: "2026-11-01",
    end_date: "2026-11-05",
  },
  {
    title: "Draft onboarding checklist",
    assignTo: "Sam Chen",
    status: "general",
    start_date: "2026-11-02",
    end_date: "2026-11-08",
  },
  {
    title: "Prioritize Q4 milestones",
    assignTo: "Jordan Lee",
    status: "backlog",
    start_date: "2026-11-03",
    end_date: "2026-11-12",
  },
  {
    title: "Define board status rules",
    assignTo: "Alex Rivera",
    status: "backlog",
    start_date: "2026-11-04",
    end_date: "2026-11-10",
  },
  {
    title: "Build overview analytics cards",
    assignTo: "Sam Chen",
    status: "in-progress",
    start_date: "2026-11-05",
    end_date: "2026-11-18",
  },
  {
    title: "Wire drag-and-drop status updates",
    assignTo: "Jordan Lee",
    status: "in-progress",
    start_date: "2026-11-06",
    end_date: "2026-11-20",
  },
  {
    title: "Polish mobile sidebar drawer",
    assignTo: "Alex Rivera",
    status: "paused",
    start_date: "2026-11-07",
    end_date: "2026-11-22",
  },
  {
    title: "Ship members directory table",
    assignTo: "Sam Chen",
    status: "ready-to-launch",
    start_date: "2026-10-20",
    end_date: "2026-11-15",
  },
  {
    title: "Publish landing hero redesign",
    assignTo: "Jordan Lee",
    status: "ready-to-launch",
    start_date: "2026-10-22",
    end_date: "2026-11-16",
  },
];

async function seedForEmail(email: string) {
  const existing = await TaskModel.countDocuments({
    $or: [{ userEmail: email }, { email }],
  });
  if (existing > 0) return 0;

  await TaskModel.insertMany(
    SAMPLE_TASKS.map((task) => ({
      ...task,
      userEmail: email,
      email,
    })),
  );
  return SAMPLE_TASKS.length;
}

/**
 * Idempotent demo tasks:
 * - seeded admin / super admin
 * - any verified user who still has an empty board
 */
export const seedTasks = async () => {
  try {
    const emails = new Set<string>();

    if (config.ADMIN_EMAIL) {
      emails.add(String(config.ADMIN_EMAIL).toLowerCase().trim());
    }
    if (config.SUPER_ADMIN_EMAIL) {
      emails.add(String(config.SUPER_ADMIN_EMAIL).toLowerCase().trim());
    }

    const users = await UserModel.find({
      isDeleted: false,
      isVerified: true,
    })
      .select("email")
      .lean();

    users.forEach((u) => {
      if (u.email) emails.add(String(u.email).toLowerCase().trim());
    });

    let seededUsers = 0;
    for (const email of emails) {
      const created = await seedForEmail(email);
      if (created > 0) seededUsers += 1;
    }

    if (seededUsers > 0) {
      // eslint-disable-next-line no-console
      console.log(`Seeded demo tasks for ${seededUsers} user(s)`);
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Error seeding tasks:", error);
  }
};
