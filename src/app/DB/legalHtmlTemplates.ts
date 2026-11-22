/**
 * Rich HTML for About / Privacy / Terms (Planboard).
 * Compatible with sanitizeOptions. Admins edit live via dashboard rich editor.
 */

const SEED_TAG = "tm-legal-seed:v3-planboard";

export const isLegalSeedPlaceholder = (html?: string | null) => {
  if (!html) return true;
  const t = html.trim();
  if (t.length < 80) return true;
  if (t.includes("Update via Admin Settings")) return true;
  if (t.includes("Default Privacy Policy")) return true;
  if (t.includes("Default About Us")) return true;
  if (t.includes("Default Terms and Conditions")) return true;
  if (t.includes("tm-legal-seed:")) return true;
  if (t.includes("About Task Manager")) return true;
  if (t.includes("About Launchlane")) return true;
  if (t.includes("Task Manager</strong>")) return true;
  if (t.includes("Launchlane</strong>")) return true;
  return false;
};

const img = (src: string, alt: string) =>
  `<img src="${src}" alt="${alt}" style="display:block;width:100%;max-width:720px;height:auto;border-radius:12px;margin:16px 0;" />`;

const heroAbout =
  "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=80";
const heroPrivacy =
  "https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=1200&q=80";
const heroTerms =
  "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=1200&q=80";
const teamImg =
  "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?auto=format&fit=crop&w=1200&q=80";
const boardImg =
  "https://images.unsplash.com/photo-1611224923853-80b023f02d71?auto=format&fit=crop&w=1200&q=80";

export const aboutHtmlTemplate = `
<p style="display:none">${SEED_TAG}</p>
<h1>About Planboard</h1>
${img(heroAbout, "Team collaborating in a shared workspace")}
<p><strong>Planboard</strong> is a free workspace product for teams that plan and deliver work on a shared status board — with manager and member roles, projects, calendar, files, chat, and an inbox.</p>
<h2>How roles work</h2>
<ul>
  <li><strong>Workspace admins</strong> invite people, set roles, customize board statuses, and post announcement channels.</li>
  <li><strong>Managers</strong> create and assign tasks, run bulk updates, message members, and keep delivery moving.</li>
  <li><strong>Members</strong> work their assigned tasks on the board, update progress, comment, upload files, and chat with managers.</li>
</ul>
${img(boardImg, "Kanban board with status columns")}
<h2>What Planboard includes</h2>
<p>Create workspaces, invite your team, organize projects, drag tasks across statuses, track due dates on the calendar, attach documents, comment with context, and get notified in the inbox when something needs you.</p>
${img(teamImg, "Team reviewing progress together")}
<h2>Contact</h2>
<p>Product questions: ask your workspace admin, or email <a href="mailto:hello@planboard.app">hello@planboard.app</a>.</p>
<p><em>Last updated: November 2026</em></p>
`.trim();

export const privacyHtmlTemplate = `
<p style="display:none">${SEED_TAG}</p>
<h1>Privacy Policy</h1>
${img(heroPrivacy, "Privacy and account security")}
<p>This Privacy Policy explains how <strong>Planboard</strong> (“we”, “us”) collects, uses, and protects information when you use the product.</p>
<h2>1. Information we collect</h2>
<ul>
  <li><strong>Account data</strong> — name, email, hashed password, and profile details you provide.</li>
  <li><strong>Workspace data</strong> — tasks, comments, uploaded files, memberships, chat messages, statuses, and activity needed to run boards and notifications.</li>
  <li><strong>Technical data</strong> — basic logs, device/browser info, and optional push tokens if you enable notifications.</li>
</ul>
${img(teamImg, "People working with shared documents")}
<h2>2. How we use information</h2>
<ol>
  <li>To provide boards, projects, invites, calendar views, files, comments, chat, and inbox notifications.</li>
  <li>To keep accounts secure and detect abuse.</li>
  <li>To communicate changes that affect your workspace or account.</li>
</ol>
<h2>3. Sharing</h2>
<p>We do not sell personal data. Workspace content is visible to members of that workspace according to their roles. We may use trusted processors (for example cloud storage or email delivery) only to operate the service.</p>
<h2>4. Retention</h2>
<p>We keep account and workspace data while your account is active. You may request account deletion; some security logs may be retained where required.</p>
<h2>5. Your choices</h2>
<ul>
  <li>Update profile details in account settings.</li>
  <li>Leave a workspace or ask an admin to remove you.</li>
  <li>Contact us to request access or deletion where applicable.</li>
</ul>
${img(boardImg, "Organized task board")}
<h2>6. Contact</h2>
<p>Privacy requests: <a href="mailto:privacy@planboard.app">privacy@planboard.app</a></p>
<p><em>Last updated: November 2026</em></p>
`.trim();

export const termsHtmlTemplate = `
<p style="display:none">${SEED_TAG}</p>
<h1>Terms and Conditions</h1>
${img(heroTerms, "Agreement documents")}
<p>Welcome to <strong>Planboard</strong>. By creating an account or using the product, you agree to these Terms.</p>
<h2>1. The service</h2>
<p>Planboard provides free workspace tools for tasks, boards, projects, files, calendar, chat, collaboration, and related features. Features may evolve; we may add or adjust capabilities while keeping core collaboration available unless we clearly announce otherwise.</p>
${img(boardImg, "Planning work on a digital board")}
<h2>2. Accounts and workspaces</h2>
<ul>
  <li>You are responsible for your login credentials and activity under your account.</li>
  <li>Workspace admins control membership, roles, statuses, announcements, and workspace settings.</li>
  <li>Managers may assign and update work according to workspace permissions.</li>
  <li>You must only invite people you are authorized to invite.</li>
</ul>
<h2>3. Acceptable use</h2>
<p>Do not use the service to upload unlawful content, harass others, attempt unauthorized access, or disrupt the platform. We may suspend accounts that violate these rules.</p>
${img(teamImg, "Team discussing responsibilities")}
<h2>4. Your content</h2>
<p>You retain rights to content you create. You grant us a limited license to host, display, and process that content solely to operate Planboard (including backups and collaboration features).</p>
<h2>5. Availability</h2>
<p>We aim for reliable uptime but do not guarantee uninterrupted service. The product is provided “as is” to the extent permitted by law.</p>
<h2>6. Changes</h2>
<p>We may update these Terms. Continued use after changes means you accept the revised Terms. Material changes will be reflected on this page with an updated date.</p>
<h2>7. Contact</h2>
<p>Legal questions: <a href="mailto:legal@planboard.app">legal@planboard.app</a></p>
<p><em>Last updated: November 2026</em></p>
`.trim();
