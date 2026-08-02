import Stripe from "stripe";

let stripeClient: Stripe | null = null;

export function getStripe() {
  const secretKey = process.env.STRIPE_SECRET_KEY;

  if (!secretKey) {
    throw new Error("Missing STRIPE_SECRET_KEY environment variable.");
  }

  if (!stripeClient) {
    stripeClient = new Stripe(secretKey, {
      appInfo: {
        name: "LEO HR",
        version: "1.0.0",
      },
    });
  }

  return stripeClient;
}

export const stripePlans = {
  organisation_50: {
    priceId: process.env.STRIPE_PRICE_ORGANISATION_50,
    capacity: 50,
  },
  organisation_150: {
    priceId: process.env.STRIPE_PRICE_ORGANISATION_150,
    capacity: 150,
  },
  organisation_250: {
    priceId: process.env.STRIPE_PRICE_ORGANISATION_250,
    capacity: 250,
  },
} as const;

export type StripePlanKey = keyof typeof stripePlans;

export function getStripePlan(planKey: string) {
  if (!(planKey in stripePlans)) {
    return null;
  }

  const plan = stripePlans[planKey as StripePlanKey];

  if (!plan.priceId) {
    throw new Error(`Missing Stripe Price ID for ${planKey}.`);
  }

  return {
    planKey: planKey as StripePlanKey,
    priceId: plan.priceId,
    capacity: plan.capacity,
  };
}

export function getAppUrl(requestUrl?: string) {
  const configuredUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");

  if (configuredUrl) {
    return configuredUrl;
  }

  if (requestUrl) {
    return new URL(requestUrl).origin;
  }

  return "http://localhost:3000";
}