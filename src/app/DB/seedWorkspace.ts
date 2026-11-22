import config from "../config";
import { workspaceServices } from "../modules/Workspace/workspace.service";
import { UserModel } from "../modules/User/user.model";

/**
 * Light platform seed — ensures the platform admin has a default workspace.
 * Team + member samples are created in seedDemoData (manager-owned Acme team).
 */
export const seedWorkspacePlatform = async () => {
  try {
    const adminEmail = config.ADMIN_EMAIL;
    if (!adminEmail) return;

    const admin = await UserModel.findOne({
      email: adminEmail.toLowerCase(),
      isDeleted: false,
    });
    if (!admin) return;

    await workspaceServices.ensureDefaultWorkspace(admin._id);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Error seeding workspace platform:", error);
  }
};
