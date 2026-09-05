import { NavLink, Outlet, useLocation, Navigate } from "react-router-dom";
import { motion as Motion } from "framer-motion";
import { Sparkles, Save, Info } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useSettings } from "@/context/SettingsContext";
import { usePermissions } from "@/context/PermissionContext";
import { PAGE_PERMISSIONS } from "@/config/pagePermissions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

// Temporarily disabled while these sections are reworked.
const DISABLED_PATHS = new Set(["cinema-profile", "showtimes", "booking"]);

// Sections come from the shared catalog; `path` here is the trailing segment
// the nested <Route> matches on.
const settingsSections = PAGE_PERMISSIONS
  .filter(p => p.group === "Settings")
  .map(p => ({
    path: p.path.replace("/settings/", ""),
    label: p.page,
    icon: p.icon,
    scope: p.scope,
    permission: p.view,
    // Team, Roles, Activity Log and API Keys are org/account administration;
    // the rest configure the cinema.
    section: (p.page === "Team" || p.page === "Roles" || p.page === "Activity Log" || p.page === "API Keys")
      ? "Management"
      : p.scope === "org" ? "Organization" : "Cinema Branch",
    disabled: DISABLED_PATHS.has(p.path.replace("/settings/", "")),
  }));

/**
 * Land on the first settings section the user can actually open.
 *
 * /settings used to hard-redirect to "general", which a member without
 * settings.org.read would then be bounced straight out of.
 */
export function SettingsIndexRedirect() {
  const { isSuperAdmin } = useAuth();
  const { can } = usePermissions();
  const first = settingsSections.find(s => !s.disabled && (isSuperAdmin || !s.permission || can(s.permission)));
  return <Navigate to={first ? first.path : "/unauthorized"} replace />;
}

export function SettingsLayout() {
  const location = useLocation();
  const { user, isSuperAdmin } = useAuth();
  const { can } = usePermissions();
  const { isSectionDirty, saveSection, isSaving } = useSettings();

  // Every group is filtered now. Organization and Cinema Branch used to render
  // unconditionally, so a member with no settings permission still saw them.
  const visible = settingsSections.filter(s => isSuperAdmin || !s.permission || can(s.permission));
  const byGroup = (name) => visible.filter(s => s.section === name);

  const currentPath = location.pathname.split("/").pop() || "general";
  const currentSection = visible.find(s => s.path === currentPath);

  const handleSave = async () => {
    if (!currentSection) return;
    const sectionKey = getSectionKey(currentSection.path);
    if (!isSectionDirty(currentSection.scope, sectionKey)) {
      toast("No changes to save");
      return;
    }
    try {
      await saveSection(currentSection.scope, sectionKey);
      toast.success("Settings saved");
    } catch (err) {
      toast.error(err?.error || "Failed to save settings");
    }
  };

  const currentSectionDirty = currentSection
    ? isSectionDirty(currentSection.scope, getSectionKey(currentSection.path))
    : false;
  const currentSectionSaving = currentSection
    ? isSaving(currentSection.scope, getSectionKey(currentSection.path))
    : false;

  if (!user) return <Navigate to="/login" replace />;

  const groups = ["Organization", "Cinema Branch", "Management"]
    .map(byGroup)
    .filter(sections => sections.length > 0);

  return (
    <div className="flex flex-col bg-background">
      {/* Tab strip — sticky within the page scroll container */}
      <div className="sticky top-0 z-10 border-b border-border/50 bg-card/50 backdrop-blur-sm">
        <div className="px-6 lg:px-8 pt-5">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/20">
              <Sparkles className="h-4 w-4" />
            </div>
            <h2 className="text-sm font-bold tracking-tight text-foreground">Settings</h2>
            <span className="text-[11px] text-muted-foreground">Configure your cinema</span>
            <Info
              className="h-3.5 w-3.5 text-muted-foreground/50 hover:text-muted-foreground transition-colors cursor-help"
              title="Changes are saved per section. Unsaved edits are marked with a dot."
            />
          </div>

          <SettingsTabBar groups={groups} isSectionDirty={isSectionDirty} />
        </div>
      </div>

      {/* Section content — no inner scroll; page scroll handled by CinemaLayout */}
      <main className="flex-1 min-w-0 relative">
        <div className="p-6 lg:p-8 pb-28">
          <Outlet />
        </div>

        {/* Floating save action bar */}
        <div className="sticky bottom-0 left-0 right-0 pointer-events-none">
          <div className="flex justify-end p-4">
            <div className="pointer-events-auto flex items-center gap-3 rounded-2xl border border-border/60 bg-card/95 backdrop-blur-md px-4 py-3 shadow-2xl shadow-black/20 ring-1 ring-white/5">
              {currentSectionDirty && (
                <Badge variant="secondary" className="bg-amber-500/10 text-amber-500 border-amber-500/20 hover:bg-amber-500/15">
                  Unsaved changes
                </Badge>
              )}
              <Button
                size="sm"
                className="gap-2 px-5 shadow-lg shadow-primary/20"
                disabled={!currentSectionDirty || currentSectionSaving}
                onClick={handleSave}
              >
                <Save className="h-4 w-4" />
                {currentSectionSaving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function SettingsTabBar({ groups, isSectionDirty }) {
  return (
    <nav
      className="flex items-center gap-1 overflow-x-auto [&::-webkit-scrollbar]:hidden"
      style={{ scrollbarWidth: "none" }}
    >
      {groups.map((sections, groupIdx) => (
        <div key={groupIdx} className="flex items-center gap-1 shrink-0">
          {groupIdx > 0 && <span className="mx-2 h-4 w-px shrink-0 bg-border/50" />}
          {sections.map(({ path, label, icon, scope, disabled }) => {
            const IconComp = icon;
            const sectionKey = getSectionKey(path);
            const dirty = !disabled && isSectionDirty(scope, sectionKey);

            if (disabled) {
              return (
                <span
                  key={path}
                  aria-disabled="true"
                  title="Coming soon"
                  className="flex shrink-0 cursor-not-allowed items-center gap-2 whitespace-nowrap px-3 py-3 text-[13px] font-medium text-muted-foreground/40"
                >
                  <IconComp className="h-4 w-4 shrink-0" />
                  <span>{label}</span>
                  <Badge variant="outline" className="h-5 px-1.5 text-[9px] border-border/50 text-muted-foreground/60">
                    Soon
                  </Badge>
                </span>
              );
            }

            return (
              <NavLink
                key={path}
                to={path}
                className={({ isActive }) =>
                  `group relative flex shrink-0 items-center gap-2 whitespace-nowrap px-3 py-3 text-[13px] font-medium transition-colors duration-200 ${
                    isActive
                      ? "text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <IconComp className={`h-4 w-4 shrink-0 transition-colors ${isActive ? "text-primary" : dirty ? "text-amber-500" : ""}`} />
                    <span>{label}</span>
                    {dirty && (
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-500" title="Unsaved changes" />
                    )}
                    {isActive && (
                      <Motion.div
                        layoutId="settings-tab-underline"
                        className="absolute -bottom-px left-2 right-2 h-[2px] rounded-full bg-primary"
                        transition={{ type: "spring", stiffness: 500, damping: 40 }}
                      />
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </div>
      ))}
    </nav>
  );
}

function getSectionKey(path) {
  const map = {
    "general": "general",
    "cinema-profile": "cinema_profile",
    "showtimes": "showtimes",
    "booking": "booking",
    "payment": "payment",
    "team": "team",
    "roles": "roles",
    "audit-log": "audit-log",
  };
  return map[path] || path;
}
