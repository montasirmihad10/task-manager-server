import { PRODUCT } from "../../constants/product";

/**
 * Billing / payments module — STUB ONLY.
 * Product is free for now (`PRODUCT.IS_FREE === true`, `BILLING_ENABLED === false`).
 * Keep this module so a future paid tier can plug Stripe/config without reshaping the app.
 * Do not charge users while BILLING_ENABLED is false.
 */
export type BillingPlanId = "free" | "pro" | "business";

export type BillingPlan = {
  id: BillingPlanId;
  name: string;
  priceMonthly: number;
  features: string[];
  active: boolean;
};

const PLANS: BillingPlan[] = [
  {
    id: "free",
    name: "Free",
    priceMonthly: 0,
    features: [
      "Unlimited personal tasks",
      "Workspaces & roles",
      "Projects, docs, comments",
      "Reminders & exports",
    ],
    active: true,
  },
  {
    id: "pro",
    name: "Pro (future)",
    priceMonthly: 0,
    features: ["Not available — product is free"],
    active: false,
  },
  {
    id: "business",
    name: "Business (future)",
    priceMonthly: 0,
    features: ["Not available — product is free"],
    active: false,
  },
];

const getBillingStatus = () => ({
  isFreeProduct: PRODUCT.IS_FREE,
  billingEnabled: PRODUCT.BILLING_ENABLED,
  currentPlan: "free" as BillingPlanId,
  message: PRODUCT.BILLING_ENABLED
    ? "Billing is enabled"
    : "This product is free. Billing is stubbed for future configuration only.",
  plans: PLANS,
});

const createCheckoutSession = async (_workspaceId: string, _planId: string) => {
  if (!PRODUCT.BILLING_ENABLED) {
    return {
      ok: false,
      disabled: true,
      message:
        "Payments are disabled. Set BILLING_ENABLED / PRODUCT flags when you are ready to monetize.",
    };
  }
  // Future: Stripe Checkout Session
  return {
    ok: false,
    disabled: true,
    message: "Stripe checkout not implemented yet",
  };
};

const handleWebhook = async (_payload: unknown, _signature?: string) => {
  if (!PRODUCT.BILLING_ENABLED) {
    return { received: false, ignored: true };
  }
  // Future: verify Stripe signature and update workspace plan
  return { received: false, ignored: true, reason: "not_implemented" };
};

export const billingServices = {
  getBillingStatus,
  createCheckoutSession,
  handleWebhook,
};
