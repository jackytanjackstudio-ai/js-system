// ── Role definitions ─────────────────────────────────────────────────────────
export type UserRole =
  | "admin"
  | "supervisor"
  | "staff"
  | "marketing"
  | "content"
  | "cs"
  | "product";

// ── Permission levels ────────────────────────────────────────────────────────
export type PermissionLevel =
  | "full"
  | "read"
  | "own_outlet"
  | "upload"
  | "task_only"
  | "vm_task"
  | "content_plan"
  | "cs_review"
  | "lead_view"
  | "none";

// ── Permission matrix ────────────────────────────────────────────────────────
export const PERMISSIONS: Record<string, Record<UserRole, PermissionLevel>> = {
  dashboard: {
    admin: "full", supervisor: "full", staff: "full",
    marketing: "full", content: "full", cs: "full", product: "full",
  },

  // STRATEGY
  "strategy-hub": {
    admin: "full", supervisor: "none", staff: "none",
    marketing: "full", content: "none", cs: "none", product: "read",
  },
  "strategy-dashboard": {
    admin: "full", supervisor: "read", staff: "none",
    marketing: "read", content: "none", cs: "none", product: "none",
  },
  "admin-strategy": {
    admin: "full", supervisor: "none", staff: "none",
    marketing: "none", content: "none", cs: "none", product: "none",
  },

  // SIGNALS
  "product-feedback": {
    admin: "full", supervisor: "own_outlet", staff: "own_outlet",
    marketing: "read", content: "none", cs: "none", product: "full",
  },
  "customer-input": {
    admin: "full", supervisor: "own_outlet", staff: "own_outlet",
    marketing: "read", content: "none", cs: "read", product: "read",
  },
  "sales-report": {
    admin: "full", supervisor: "own_outlet", staff: "own_outlet",
    marketing: "read", content: "none", cs: "none", product: "none",
  },
  "creator-insight": {
    admin: "full", supervisor: "upload", staff: "none",
    marketing: "full", content: "full", cs: "none", product: "none",
  },
  "creator-hub": {
    admin: "full", supervisor: "full", staff: "full",
    marketing: "full", content: "full", cs: "none", product: "none",
  },
  reviews: {
    admin: "full", supervisor: "read", staff: "none",
    marketing: "full", content: "full", cs: "full", product: "read",
  },
  "data-hub": {
    admin: "full", supervisor: "none", staff: "none",
    marketing: "read", content: "none", cs: "none", product: "read",
  },

  // EXECUTION
  campaign: {
    admin: "full", supervisor: "vm_task", staff: "task_only",
    marketing: "full", content: "content_plan", cs: "none", product: "none",
  },
  "roadshow-hub": {
    admin: "full", supervisor: "full", staff: "read",
    marketing: "full", content: "none", cs: "none", product: "none",
  },
  "product-war-room": {
    admin: "full", supervisor: "none", staff: "none",
    marketing: "read", content: "none", cs: "none", product: "full",
  },
  "product-master": {
    admin: "full", supervisor: "none", staff: "none",
    marketing: "none", content: "none", cs: "none", product: "full",
  },
  outlets: {
    admin: "full", supervisor: "none", staff: "none",
    marketing: "none", content: "none", cs: "none", product: "none",
  },
  leads: {
    admin: "full", supervisor: "lead_view", staff: "lead_view",
    marketing: "read", content: "none", cs: "cs_review", product: "none",
  },
  execution: {
    admin: "full", supervisor: "full", staff: "own_outlet",
    marketing: "own_outlet", content: "own_outlet", cs: "own_outlet", product: "own_outlet",
  },

  // CULTURE
  rewards: {
    admin: "full", supervisor: "full", staff: "full",
    marketing: "none", content: "none", cs: "none", product: "none",
  },
  leaderboard: {
    admin: "full", supervisor: "full", staff: "full",
    marketing: "none", content: "none", cs: "none", product: "none",
  },

  // SYSTEM
  settings: {
    admin: "full", supervisor: "none", staff: "none",
    marketing: "none", content: "none", cs: "none", product: "none",
  },
  "admin-panel": {
    admin: "full", supervisor: "none", staff: "none",
    marketing: "none", content: "none", cs: "none", product: "none",
  },
};

// ── Role normalization (old → new) ──────────────────────────────────────────
// Existing DB roles: admin, manager, product, sales, creator
// Map old names to new role system without touching the database
const ROLE_MAP: Record<string, UserRole> = {
  manager: "supervisor",
  sales:   "staff",
  creator: "content",
};

export function normalizeRole(role: string): UserRole {
  return (ROLE_MAP[role] as UserRole) ?? (role as UserRole) ?? "staff";
}

// ── Helper functions ─────────────────────────────────────────────────────────

export function canAccess(role: UserRole, module: string): boolean {
  return (PERMISSIONS[module]?.[role] ?? "none") !== "none";
}

export function getPermission(role: UserRole, module: string): PermissionLevel {
  return PERMISSIONS[module]?.[role] ?? "none";
}

// ── Role display labels ──────────────────────────────────────────────────────
export const ROLE_LABELS: Record<UserRole, string> = {
  admin:      "Admin",
  supervisor: "Store Supervisor",
  staff:      "Store Staff",
  marketing:  "Marketing",
  content:    "Content Team",
  cs:         "Customer Service",
  product:    "Product Team",
};

// All valid role values (for dropdowns, validation)
export const ALL_ROLES: UserRole[] = [
  "admin", "supervisor", "staff", "marketing", "content", "cs", "product",
];
