import { PRODUCT } from "../../constants/product";
import { sendEmail } from "../../utils/sendEmail";
import { sendNotification } from "../Notification/notification.utils";
import { TaskModel } from "../Task/task.model";
import { UserModel } from "../User/user.model";
import { ReminderModel } from "./reminder.model";

const scheduleDueRemindersForTask = async (taskId: string) => {
  const task = await TaskModel.findById(taskId);
  if (!task?.dueDate || !task.workspaceId || !task.assigneeId) return;

  const due = new Date(task.dueDate);
  const soon = new Date(due.getTime() - 24 * 60 * 60 * 1000);

  await ReminderModel.deleteMany({
    taskId,
    sentAt: null,
    kind: { $in: ["due_soon", "overdue"] },
  });

  await ReminderModel.create([
    {
      taskId,
      workspaceId: task.workspaceId,
      userId: task.assigneeId,
      remindAt: soon,
      kind: "due_soon",
    },
    {
      taskId,
      workspaceId: task.workspaceId,
      userId: task.assigneeId,
      remindAt: due,
      kind: "overdue",
    },
  ]);
};

const processDueReminders = async () => {
  const now = new Date();
  const due = await ReminderModel.find({
    sentAt: null,
    remindAt: { $lte: now },
  }).limit(100);

  for (const reminder of due) {
    const task = await TaskModel.findById(reminder.taskId);
    const user = await UserModel.findById(reminder.userId).select(
      "email name fcmToken",
    );
    if (!task || !user) {
      reminder.sentAt = now;
      await reminder.save();
      continue;
    }

    const title =
      reminder.kind === "overdue" ? "Task overdue" : "Task due soon";
    const message = `${task.title} — due ${task.dueDate?.toISOString().slice(0, 10) || ""}`;

    try {
      await sendNotification({
        recipientId: reminder.userId,
        type: "task_updated",
        title,
        message,
        data: {
          taskId: String(task._id),
          kind: reminder.kind,
        },
      });
    } catch {
      // continue
    }

    try {
      await sendEmail(
        user.email,
        title,
        `<p>${message}</p><p>Open your Task Manager board to update it.</p>`,
      );
    } catch {
      // continue
    }

    reminder.sentAt = now;
    await reminder.save();
    task.lastReminderAt = now;
    await task.save();
  }

  // Also spawn next occurrence for recurring tasks that are due
  const recurring = await TaskModel.find({
    "recurrence.enabled": true,
    "recurrence.nextRunAt": { $lte: now },
    isArchived: { $ne: true },
  }).limit(50);

  for (const task of recurring) {
    if (!task.recurrence) continue;
    const { freq, interval } = task.recurrence;
    const next = new Date(task.recurrence.nextRunAt || now);
    if (freq === "daily") next.setDate(next.getDate() + interval);
    if (freq === "weekly") next.setDate(next.getDate() + 7 * interval);
    if (freq === "monthly") next.setMonth(next.getMonth() + interval);

    await TaskModel.create({
      title: task.title,
      assignTo: task.assignTo,
      status: "general",
      start_date: now.toISOString().slice(0, 10),
      end_date: next.toISOString().slice(0, 10),
      userEmail: task.userEmail,
      email: task.email,
      workspaceId: task.workspaceId,
      projectId: task.projectId,
      createdBy: task.createdBy,
      assigneeId: task.assigneeId,
      description: task.description,
      priority: task.priority,
      labels: task.labels,
      labelIds: task.labelIds,
      dueDate: next,
      estimateHours: task.estimateHours,
      watcherIds: task.watcherIds,
    });

    task.recurrence.nextRunAt = next;
    if (task.recurrence.endAt && next > task.recurrence.endAt) {
      task.recurrence.enabled = false;
    }
    await task.save();
  }

  return { processedReminders: due.length, recurringSpawned: recurring.length };
};

let reminderTimer: NodeJS.Timeout | null = null;

const startReminderWorker = () => {
  if (reminderTimer) return;
  // eslint-disable-next-line no-console
  console.log(
    `Reminder worker started (every ${PRODUCT.REMINDER_SCAN_INTERVAL_MS / 60000}m)`,
  );
  reminderTimer = setInterval(() => {
    processDueReminders().catch((err) =>
      // eslint-disable-next-line no-console
      console.error("Reminder worker error:", err),
    );
  }, PRODUCT.REMINDER_SCAN_INTERVAL_MS);
};

export const reminderServices = {
  scheduleDueRemindersForTask,
  processDueReminders,
  startReminderWorker,
};
