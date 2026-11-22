import { ILandingContent } from "./landing.interface";

/**
 * Default public landing content (MongoDB).
 * Image URLs are starter assets — replace via Landing CMS → Cloudinary.
 */
export const DEFAULT_LANDING: ILandingContent = {
  hero: {
    brand: "Planboard",
    headline: "Managers assign. Members deliver. Everyone sees the board.",
    subhead:
      "One free workspace with a clear status path, roles that match real teams, calendar, projects, chat, and an inbox.",
    primaryCta: "Create free account",
    secondaryCta: "See how roles work",
    bannerImage: "",
    accentImage: "/brand/planboard-hero-illustration.jpg",
  },
  roles: {
    eyebrow: "How Planboard works",
    title: "Manager or member. Clear jobs.",
    subtitle:
      "Nobody signs up as an admin. Managers lead teams. Members work solo or join a manager’s workspace when invited.",
    cards: [
      {
        key: "manager",
        eyebrow: "Manager",
        title: "Lead a team workspace",
        summary:
          "Sign up as a manager to create a team board, invite people, and assign work.",
        points: [
          "Create your team workspace on signup",
          "Invite members by email link or temporary login",
          "Assign tasks, bulk-update, and clear overdue work",
          "Message members when something needs a conversation",
        ],
        ctaLabel: "Create manager account",
        ctaHref: "/register?intent=manager",
      },
      {
        key: "member",
        eyebrow: "Member",
        title: "Work solo — or join a team",
        summary:
          "Sign up as a member for a personal board, or accept a manager’s invite to join their workspace.",
        points: [
          "Solo: your own board, no team under you",
          "Invited: join via link or temporary password",
          "Update tasks assigned to you from My work",
          "Comment, upload files, and track due dates",
        ],
        ctaLabel: "See the status path",
        ctaHref: "#pipeline",
      },
    ],
  },
  product: {
    eyebrow: "What you get",
    title: "Everything your team needs on one board.",
    subtitle:
      "Planboard keeps status, ownership, deadlines, files, and chat connected — without a paid wall for the core product.",
    items: [
      {
        title: "Kanban board with your statuses",
        body: "Drag tasks through General, Backlog, In progress, Paused, and Ready to launch — or customize columns in workspace settings.",
        moreInfo:
          "Every workspace starts with a clear five-stage board. Managers who own the workspace can rename, reorder, or add statuses so the columns match how your team ships. Drag cards between columns, filter by status, and keep ownership visible without leaving the board.",
        image:
          "https://images.unsplash.com/photo-1611224923853-80b023f02d71?auto=format&fit=crop&w=1000&q=80",
        iconKey: "boards",
      },
      {
        title: "Roles that match the work",
        body: "Managers lead the team workspace. Members focus on assigned work, comments, and checklists.",
        moreInfo:
          "The workspace owner (shown as Manager) sets people and board structure. Managers create and assign work, use overdue views, and message the team. Members open My work, update their own tasks, and stay on the shared board for context — without editing everyone else’s queue.",
        image:
          "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?auto=format&fit=crop&w=1000&q=80",
        iconKey: "roles",
      },
      {
        title: "Calendar tied to due dates",
        body: "See what’s due, overdue, and upcoming — open a task, filter by status, and keep deadlines visible.",
        moreInfo:
          "Due dates sync with the calendar view so managers can spot slips early and members can plan their week. Overdue and due-this-week filters keep the next deadline in reach from Overview, Manage, and My work.",
        image:
          "https://images.unsplash.com/photo-1506784983877-45594efa4cbe?auto=format&fit=crop&w=1000&q=80",
        iconKey: "calendar",
      },
      {
        title: "Chat, files & inbox",
        body: "Message teammates, attach files, and get notified when something needs you.",
        moreInfo:
          "Direct messages, announcement channels, task files, comments, and an inbox stay in one place. When something is assigned or mentioned, you get notified — so follow-ups don’t disappear into scattered chats.",
        image:
          "https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=1000&q=80",
        iconKey: "free",
      },
    ],
  },
  pipeline: {
    eyebrow: "Default board flow",
    title: "Five stages from first note to launch-ready.",
    subtitle:
      "Every new workspace starts with this path. Workspace managers can rename, reorder, or add statuses so the board matches how your team works. Click a stage to learn more.",
    image:
      "https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=1400&q=80",
    stages: [
      {
        name: "General",
        detail: "Park raw ideas and intake items before they hit the backlog.",
        moreInfo:
          "General is the intake lane. Capture notes from standups, requests from chat, and half-formed ideas without forcing a priority yet. Managers later pull the best items into Backlog; members can still see what is waiting so nothing disappears into a private list.",
        image:
          "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1200&q=80",
      },
      {
        name: "Backlog",
        detail: "Prioritized work waiting to be pulled into active progress.",
        moreInfo:
          "Backlog is the agreed queue. Items here are clarified enough to assign: owner, rough due date, and priority. Managers use this column to plan the next stretch of work; members know that when a card lands on them from Backlog, it is ready to start.",
        image:
          "https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?auto=format&fit=crop&w=1200&q=80",
      },
      {
        name: "In progress",
        detail: "What the team is executing right now — visible on the board.",
        moreInfo:
          "In progress means someone is actively working the task. Keep this column honest — move cards here when work starts, update status and comments as you go, and attach files so managers can unblock without chasing updates in chat.",
        image:
          "https://images.unsplash.com/photo-1553877522-43269d4ea984?auto=format&fit=crop&w=1200&q=80",
      },
      {
        name: "Paused",
        detail: "Blocked or deferred work kept in context until it can move again.",
        moreInfo:
          "Paused keeps blocked or deferred work visible instead of mixed into active work. Note why it stopped (waiting on review, dependency, capacity). Managers scan Paused to clear blockers; members move cards back to In progress when they can continue.",
        image:
          "https://images.unsplash.com/photo-1507925921958-8a62f3d1a50d?auto=format&fit=crop&w=1200&q=80",
      },
      {
        name: "Ready to launch",
        detail: "Finished work waiting for final check or release.",
        moreInfo:
          "Ready to launch is done-enough for review or release. Use it for QA, handoff, or go-live checks. Closing here keeps a clear finish line on the board so the team can see what shipped versus what is still in motion.",
        image:
          "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80",
      },
    ],
  },
  legal: {
    eyebrow: "Trust & policies",
    title: "How we handle the product and your data.",
    subtitle:
      "About, Privacy, and Terms are edited in the dashboard and served live from the API.",
    docs: [
      {
        slug: "about",
        title: "About us",
        blurb:
          "What Planboard is and how workspaces, roles, and the board fit together.",
        coverImage:
          "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=80",
      },
      {
        slug: "privacy",
        title: "Privacy policy",
        blurb: "How account and workspace data is collected and used.",
        coverImage:
          "https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=1200&q=80",
      },
      {
        slug: "terms",
        title: "Terms & conditions",
        blurb: "Rules for using Planboard workspaces and accounts.",
        coverImage:
          "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=1200&q=80",
      },
    ],
  },
  close: {
    eyebrow: "Free forever for the core",
    title: "Open a workspace and start the board.",
    subtitle:
      "Register, create or join a workspace, invite managers and members, and put your first task on Planboard today.",
    backgroundImage:
      "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=2000&q=80",
    primaryCta: "Create account",
    secondaryCta: "Log in",
  },
};
