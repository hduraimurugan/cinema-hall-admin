/**
 * The single source of truth mapping admin pages to permission keys.
 *
 * Consumed by AppSidebar (which nav items render), App.jsx (which routes are
 * reachable), SettingsLayout (which settings sections render) and
 * PermissionMatrixTable (what the Owner can toggle). Keeping one list means
 * the nav, the router and the role editor can never disagree about what a
 * page requires — the previous editor kept its own hardcoded list and drifted
 * into offering ~20 permission keys the database has never had.
 *
 * Every key here must exist in the `permissions` table. The editor reconciles
 * this list against GET /api/roles/permissions at render time and surfaces
 * anything unmapped under "Advanced", so a newly seeded permission is never
 * silently uneditable.
 */

import {
  Home, Building2, Monitor, Film, Calendar, Ticket, RefreshCw,
  CreditCard, ScanLine, Tag, Megaphone, Users, Settings, Shield, History,
} from "lucide-react"

export const PAGE_PERMISSIONS = [
  // ── Operations ────────────────────────────────────────────────────
  { group: "Operations", page: "Dashboard",      path: "/",               icon: Home,      view: "dashboard.view" },
  { group: "Operations", page: "My Halls",       path: "/halls",          icon: Building2, view: "halls.read",    edit: "halls.manage" },
  { group: "Operations", page: "Screens",        path: "/screens",        icon: Monitor,   view: "screens.read",  create: "screens.create", edit: "screens.update", remove: "screens.delete" },
  { group: "Operations", page: "Movies",         path: "/movies",         icon: Film,      view: "movies.read",   create: "movies.create",  edit: "movies.update",  remove: "movies.delete" },
  { group: "Operations", page: "Showtimes",      path: "/shows",          icon: Calendar,  view: "shows.read",    create: "shows.create",   edit: "shows.update",   remove: "shows.delete", extra: ["shows.cancel"] },
  { group: "Operations", page: "Bookings",       path: "/bookings",       icon: Ticket,    view: "bookings.read", edit: "bookings.modify",  extra: ["bookings.verify", "bookings.cancel"] },
  { group: "Operations", page: "Refunds",        path: "/refunds",        icon: RefreshCw, view: "refunds.read",  create: "refunds.create", extra: ["refunds.settle"] },
  { group: "Operations", page: "Payment Orders", path: "/payment-orders", icon: CreditCard,view: "payment.read",  edit: "payment.manage",   extra: ["payment.settle"] },
  { group: "Operations", page: "Verify Ticket",  path: "/verify-ticket",  icon: ScanLine,  view: "verify-ticket.use" },

  // ── Promotions ────────────────────────────────────────────────────
  { group: "Promotions", page: "Offers", path: "/offers", icon: Tag,      view: "offers.read", create: "offers.create", edit: "offers.update", remove: "offers.delete" },
  // Ads have no org/hall column in the schema, so they stay platform-global.
  { group: "Promotions", page: "Ads",    path: "/ads",    icon: Megaphone, view: "ads.read",   create: "ads.create",    edit: "ads.update",    remove: "ads.delete", superAdminOnly: true },

  // ── Management ────────────────────────────────────────────────────
  // Customers currently returns all platform customers, so it stays superAdmin-only.
  { group: "Management", page: "Customers", path: "/customers", icon: Users, view: "customers.read", edit: "customers.manage", superAdminOnly: true },
  // No Analytics or Revenue page exists yet — they were dead sidebar links that
  // fell through the catch-all to "/". Their permissions stay editable under
  // Advanced so the roles are ready when the pages land.

  // ── Settings ──────────────────────────────────────────────────────
  { group: "Settings", page: "General",        path: "/settings/general",        icon: Settings,   scope: "org",  view: "settings.org.read",  edit: "settings.org.update" },
  { group: "Settings", page: "Payment",        path: "/settings/payment",        icon: CreditCard, scope: "org",  view: "settings.org.read",  edit: "settings.org.update" },
  { group: "Settings", page: "Cinema Profile", path: "/settings/cinema-profile", icon: Building2,  scope: "hall", view: "settings.hall.read", edit: "settings.hall.update" },
  { group: "Settings", page: "Showtimes",      path: "/settings/showtimes",      icon: Calendar,   scope: "hall", view: "settings.hall.read", edit: "settings.hall.update" },
  { group: "Settings", page: "Booking",        path: "/settings/booking",        icon: Ticket,     scope: "hall", view: "settings.hall.read", edit: "settings.hall.update" },
  { group: "Settings", page: "Team",           path: "/settings/team",           icon: Users,      scope: "org",  view: "team.manage",        extra: ["team.invite", "team.revoke"] },
  { group: "Settings", page: "Roles",          path: "/settings/roles",          icon: Shield,     scope: "org",  view: "roles.read",         edit: "roles.manage" },
  { group: "Settings", page: "Activity Log",   path: "/settings/audit-log",      icon: History,    scope: "org",  view: "audit.view" },
]

/** Permissions with no page of their own — rendered as a flat "Advanced" group. */
export const ADVANCED_PERMISSIONS = [
  "analytics.view",
  "analytics.manage",
  "settings.user.read",
  "settings.user.update",
  "settings.advanced.manage",
  "integrations.manage",
  "billing.manage",
  "org.delete",
]

/** Column order for the editor. `remove` avoids shadowing Array.prototype.delete semantics. */
export const ACTION_COLUMNS = [
  { key: "view",   label: "View" },
  { key: "create", label: "Create" },
  { key: "edit",   label: "Edit" },
  { key: "remove", label: "Delete" },
]

/** Every permission key referenced by a page row, in declaration order. */
export function keysForPage(page) {
  return [
    ...ACTION_COLUMNS.map(c => page[c.key]).filter(Boolean),
    ...(page.extra || []),
  ]
}

/** All keys this catalog knows how to render, for reconciling against the API. */
export function allMappedKeys() {
  return new Set([
    ...PAGE_PERMISSIONS.flatMap(keysForPage),
    ...ADVANCED_PERMISSIONS,
  ])
}

/** Pages in a group, filtered by a `can(key)` predicate against their view key. */
export function visiblePages(group, can, isSuperAdmin = false) {
  return PAGE_PERMISSIONS.filter(p => {
    if (p.group !== group) return false
    if (p.superAdminOnly && !isSuperAdmin) return false
    if (isSuperAdmin) return true
    return !p.view || can(p.view)
  })
}
