import mongoose from "mongoose";
import config from "../app/config";
import { WorkspaceModel } from "../app/modules/Workspace/workspace.model";
import { TaskModel } from "../app/modules/Task/task.model";

async function main() {
  if (!config.DATABASE_URL) throw new Error("DATABASE_URL missing");
  await mongoose.connect(config.DATABASE_URL);
  const demos = await WorkspaceModel.find({
    name: /demo/i,
    isDeleted: { $ne: true },
  });
  for (const d of demos) {
    const n = await TaskModel.countDocuments({
      workspaceId: d._id,
      isArchived: { $ne: true },
    });
    // eslint-disable-next-line no-console
    console.log("found", d.name, "tasks", n, "slug", d.slug);
    if (n === 0) {
      d.isDeleted = true;
      await d.save();
      // eslint-disable-next-line no-console
      console.log("soft-deleted", d.name);
    }
  }
  await mongoose.disconnect();
}

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e);
  process.exit(1);
});
