export type ILandingPillar = {
  title: string;
  body: string;
  image: string;
  /** Longer copy shown when the product card is clicked */
  moreInfo?: string;
  iconKey?: "boards" | "roles" | "calendar" | "free" | string;
};

export type ILandingStage = {
  name: string;
  /** Short card blurb on the home page */
  detail: string;
  /** Longer copy shown in the stage modal */
  moreInfo?: string;
  /** Optional image inside the stage detail modal */
  image?: string;
};

export type ILandingRoleCard = {
  key: "manager" | "member" | string;
  eyebrow: string;
  title: string;
  summary: string;
  points: string[];
  ctaLabel?: string;
  ctaHref?: string;
};

export type ILandingContent = {
  hero: {
    brand: string;
    headline: string;
    subhead: string;
    primaryCta: string;
    secondaryCta: string;
    /** Full-bleed banner behind hero (Cloudinary or any https URL) */
    bannerImage: string;
    /** Optional secondary image near the board */
    accentImage?: string;
  };
  /** Manager vs member explainer on the home page */
  roles?: {
    eyebrow: string;
    title: string;
    subtitle: string;
    cards: ILandingRoleCard[];
  };
  product: {
    eyebrow: string;
    title: string;
    subtitle: string;
    items: ILandingPillar[];
  };
  pipeline: {
    eyebrow: string;
    title: string;
    subtitle: string;
    /** Optional supporting image above/beside pipeline */
    image?: string;
    stages: ILandingStage[];
  };
  legal: {
    eyebrow: string;
    title: string;
    subtitle: string;
    /** Cards on the home legal section — linked to /legal/:slug */
    docs: Array<{
      slug: "about" | "privacy" | "terms" | string;
      title: string;
      blurb: string;
      coverImage: string;
    }>;
  };
  close: {
    eyebrow: string;
    title: string;
    subtitle: string;
    backgroundImage: string;
    primaryCta: string;
    secondaryCta: string;
  };
};

export type ILandingDocument = ILandingContent & {
  _id?: string;
  updatedBy?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
};
