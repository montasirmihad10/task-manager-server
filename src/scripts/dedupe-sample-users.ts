import mongoose from "mongoose";
import config from "../app/config";
import { UserModel } from "../app/modules/User/user.model";
import { WorkspaceMemberModel } from "../app/modules/Workspace/workspaceMember.model";
import { NotificationModel } from "../app/modules/Notification/notification.model";

const EMAILS = [
  "manager@planboard.local",
  "member@planboard.local",
  "alex@planboard.local",
  "solo@planboard.local",
];

async function main() {
  if (!config.DATABASE_URL) throw new Error("DATABASE_URL missing");
  await mongoose.connect(config.DATABASE_URL);

  for (const email of EMAILS) {
    const users = await UserModel.find({ email: email.toLowerCase() }).sort({
      createdAt: -1,
    });
    // eslint-disable-next-line no-console
    console.log(email, "count=", users.length);
    if (users.length <= 1) continue;
    const keep = users[0];
    for (const d of users.slice(1)) {
      await WorkspaceMemberModel.deleteMany({ userId: d._id });
      await NotificationModel.deleteMany({ recipient: d._id });
      await UserModel.deleteOne({ _id: d._id });
      // eslint-disable-next-line no-console
      console.log("removed duplicate", email, String(d._id), "kept", String(keep._id));
    }
  }

  // Also remove duplicate memberships for same workspace+user (defensive)
  const members = await WorkspaceMemberModel.find({}).select(
    "_id workspaceId userId createdAt",
  );
  const seen = new Map<string, string>();
  for (const m of members) {
    const key = `${m.workspaceId}:${m.userId}`;
    const existing = seen.get(key);
    if (!existing) {
      seen.set(key, String(m._id));
      continue;
    }
    await WorkspaceMemberModel.deleteOne({ _id: m._id });
    // eslint-disable-next-line no-console
    console.log("removed duplicate membership", key, String(m._id));
  }

  await mongoose.disconnect();
  // eslint-disable-next-line no-console
  console.log("Done.");
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
