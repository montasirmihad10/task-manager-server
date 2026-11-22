import express from "express";
import auth from "../../middlewares/auth";
import { billingControllers } from "./billing.controller";

/**
 * Billing routes are registered but inactive while the product is free.
 * UI can call GET /billing/status to know not to show payment screens.
 */
const router = express.Router();

router.get("/status", auth("user", "admin", "super_admin"), billingControllers.getStatus);
router.post(
  "/checkout",
  auth("user", "admin", "super_admin"),
  billingControllers.createCheckout,
);
router.post("/webhook", billingControllers.webhook);

export const BillingRoutes = router;
