import { Router } from "express";
import { userRoutes } from "../modules/User/user.routes";
import { AuthRoutes } from "../modules/Auth/auth.route";
import { notificationRoutes } from "../modules/Notification/notification.route";
import { conversationRoutes } from "../modules/Conversation/conversation.route";
import { messageRoutes } from "../modules/Message/message.route";
import { AboutRoutes } from "../modules/Settings/About/About.route";
import { PrivacyRoutes } from "../modules/Settings/privacy/Privacy.route";
import { TermsRoutes } from "../modules/Settings/Terms/Terms.route";
import { TaskRoutes } from "../modules/Task/task.route";
import { DetailRoutes } from "../modules/Detail/detail.route";
import { WorkspaceRoutes } from "../modules/Workspace/workspace.route";
import { ProjectRoutes } from "../modules/Project/project.route";
import { DocumentRoutes } from "../modules/Document/document.route";
import { WorkspaceStatusRoutes } from "../modules/WorkspaceStatus/workspaceStatus.route";
import { LabelRoutes } from "../modules/Label/label.route";
import { InviteRoutes } from "../modules/Invite/invite.route";
import { SavedViewRoutes } from "../modules/SavedView/savedView.route";
import { TemplateRoutes } from "../modules/Template/template.route";
import { DashboardRoutes } from "../modules/Dashboard/dashboard.route";
import { BillingRoutes } from "../modules/Billing/billing.route";
import { LandingRoutes } from "../modules/Landing/landing.route";

const router = Router();

const moduleRoutes = [
  {
    path: "/users",
    route: userRoutes,
  },
  {
    path: "/auth",
    route: AuthRoutes,
  },
  {
    path: "/workspaces",
    route: WorkspaceRoutes,
  },
  {
    path: "/projects",
    route: ProjectRoutes,
  },
  {
    path: "/documents",
    route: DocumentRoutes,
  },
  {
    path: "/statuses",
    route: WorkspaceStatusRoutes,
  },
  {
    path: "/labels",
    route: LabelRoutes,
  },
  {
    path: "/invites",
    route: InviteRoutes,
  },
  {
    path: "/saved-views",
    route: SavedViewRoutes,
  },
  {
    path: "/templates",
    route: TemplateRoutes,
  },
  {
    path: "/dashboard",
    route: DashboardRoutes,
  },
  {
    path: "/billing",
    route: BillingRoutes,
  },
  {
    path: "/tasks",
    route: TaskRoutes,
  },
  {
    path: "/detail",
    route: DetailRoutes,
  },


  {
    path: "/notifications",
    route: notificationRoutes,
  },
  {
    path: "/notification",
    route: notificationRoutes,
  },
  {
    path: "/conversations",
    route: conversationRoutes,
  },
  {
    path: "/messages",
    route: messageRoutes,
  },
  {
    path: "/settings/about",
    route: AboutRoutes,
  },
  {
    path: "/settings/privacy",
    route: PrivacyRoutes,
  },
  {
    path: "/settings/terms",
    route: TermsRoutes,
  },
  {
    path: "/settings/landing",
    route: LandingRoutes,
  },
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
