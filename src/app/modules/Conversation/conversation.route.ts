import express from "express";
import { conversationControllers } from "./conversation.controller";
import auth from "../../middlewares/auth";

const router = express.Router();

router.post(
  "/",
  auth("user", "admin", "super_admin"),
  conversationControllers.createOrGetConversation,
);

router.post(
  "/ensure-channels",
  auth("user", "admin", "super_admin"),
  conversationControllers.ensureWorkspaceChannels,
);

router.get(
  "/",
  auth("user", "admin", "super_admin"),
  conversationControllers.getMyConversations,
);

router.get(
  "/:id",
  auth("user", "admin", "super_admin"),
  conversationControllers.getConversationById,
);

router.delete(
  "/:id",
  auth("user", "admin", "super_admin"),
  conversationControllers.deleteConversation,
);

export const conversationRoutes = router;
