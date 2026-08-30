/**
 * OS³ Command Centre — single source of truth for the 14-route navigation.
 * Order here = order in the sidebar.  Don't reorder casually; some panels
 * reference each other and users build muscle memory.
 */
import type { LucideIcon } from "lucide-react";
import {
  Home,
  Scale,
  Wallet,
  MessageSquare,
  ToggleLeft,
  Network,
  FolderGit2,
  CalendarDays,
  Image,
  Megaphone,
  Newspaper,
  StickyNote,
  Link2,
  Settings2,
  Layers,
} from "lucide-react";

export type NavGroup = "ops" | "finance" | "comms" | "infra" | "content" | "system";

export interface NavItem {
  /** URL path — also the React Router route */
  path: string;
  /** Sidebar label */
  label: string;
  /** Lucide icon */
  icon: LucideIcon;
  /** Logical grouping — used for sidebar dividers */
  group: NavGroup;
  /** Cmd+K palette description */
  hint: string;
  /** Optional keyboard shortcut hint (display-only) */
  shortcut?: string;
}

export const NAV_ITEMS: NavItem[] = [
  { path: "/home",          label: "Home",          icon: Home,          group: "ops",     hint: "Email, tasks, calendar, priorities", shortcut: "⌘1" },
  { path: "/braveheart",    label: "BRAVEHEART",    icon: Scale,         group: "ops",     hint: "Matters, creditors, correspondence drafts" },
  { path: "/bankzero",      label: "BankZero",      icon: Wallet,        group: "finance", hint: "Personal finance — manual CSV import" },
  { path: "/whatsapp",      label: "WhatsApp",      icon: MessageSquare, group: "comms",   hint: "Bridge logs, conversations, flags" },
  { path: "/subscriptions", label: "Subscriptions", icon: ToggleLeft,    group: "ops",     hint: "Toolbox with status lights — toggle on/off" },
  { path: "/executive-suite", label: "Executive Suite", icon: Layers,      group: "ops",     hint: "Inbound leads & AI briefings, SponcerFlow outbound" },
  { path: "/ecosystem",     label: "Ecosystem",     icon: Network,       group: "infra",   hint: "Connected services map — overview" },
  { path: "/projects",      label: "Projects",      icon: FolderGit2,    group: "infra",   hint: "GitHub, cPanel, VSCode activity" },
  { path: "/cloud-storage", label: "Cloud Storage", icon: FolderGit2,    group: "infra",   hint: "Monitor and analyze cloud storage usage" },
  { path: "/chronicle",     label: "Chronicle",     icon: CalendarDays,  group: "content", hint: "Monthly chronicle — current + archive" },
  { path: "/media",         label: "Media",         icon: Image,         group: "content", hint: "Kanban — ideas, prompts, rendering" },
  { path: "/marketing",     label: "Marketing",     icon: Megaphone,     group: "content", hint: "Leads, CRM, campaigns" },
  { path: "/news",          label: "News",          icon: Newspaper,     group: "content", hint: "RSS + Gmail ai-news label" },
  { path: "/notes",         label: "Notes",         icon: StickyNote,    group: "content", hint: "Dropbox/Notes dump — quick captures" },
  { path: "/links",         label: "Links",         icon: Link2,         group: "infra",   hint: "Clickable index of clients & projects" },
  { path: "/config",        label: "Config",        icon: Settings2,     group: "system",  hint: "MCPs, automations, Docker, toggles" },
];

export const NAV_GROUP_LABEL: Record<NavGroup, string> = {
  ops:     "Operations",
  finance: "Finance",
  comms:   "Comms",
  infra:   "Infrastructure",
  content: "Content & Media",
  system:  "System",
};
