import mongoose from "mongoose";
import config from "../app/config";
import { WorkspaceModel } from "../app/modules/Workspace/workspace.model";
import { TaskModel } from "../app/modules/Task/task.model";
import { SubtaskModel } from "../app/modules/Subtask/subtask.model";
import { CommentModel } from "../app/modules/Comment/comment.model";
import { seedDemoData } from "../app/DB/seedDemoData";

async function main() {
  if (!config.DATABASE_URL) throw new Error("DATABASE_URL missing");
  await mongoose.connect(config.DATABASE_URL);

  const ws = await WorkspaceModel.findOne({ slug: "acme-product-team" });
  if (ws) {
    await SubtaskModel.deleteMany({ workspaceId: ws._id });
    await CommentModel.deleteMany({ workspaceId: ws._id });
    const del = await TaskModel.deleteMany({ workspaceId: ws._id });
    // eslint-disable-next-line no-console
    console.log("Deleted tasks:", del.deletedCount);
  }

  await seedDemoData();
  await mongoose.disconnect();
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
