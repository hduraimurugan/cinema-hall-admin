import { NavLink, Outlet, useLocation, Navigate } from "react-router-dom";
import { motion as Motion } from "framer-motion";
import {
  Settings, Building2, Calendar, Ticket, CreditCard,
  Sparkles, Save, Users, Shield, Info
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useSettings } from "@/context/SettingsContext";
import { usePermissions } from "@/context/PermissionContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

const orgSections = [
  { path: "general", label: "General",      icon: Settings,   scope: "org" },
  { path: "payment", label: "Payment",      icon: CreditCard, scope: "org" },
];

const hallSections = [
  { path: "cinema-profile", label: "Cinema Profile", icon: Building2,  scope: "hall" },
  { path: "showtimes",      label: "Showtimes",      icon: Calendar,   scope: "hall" },
  { path: "booking",        label: "Booking",        icon: Ticket,     scope: "hall" },
];

const managementSections = [
  { path: "team", label: "Team", icon: Users, scope: "org" },
  { path: "roles", label: "Roles", icon: Shield, scope: "org" },
];

export function SettingsLayout() {
  const location = useLocation();
  const { user } = useAuth();
  const { can } = usePermissions();
  const { isSectionDirty, saveSection, isSaving } = useSettings();

  const visibleManagementSections = managementSections.filter(s => {
    if (s.path === 'team') return can('team.manage')
    if (s.path === 'roles') return can('roles.read')
    return true
  })

  const currentPath = location.pathname.split("/").pop() || "general";
  const allSections = [...orgSections, ...hallSections, ...visibleManagementSections];
  const currentSection = allSections.find(s => s.path === currentPath);

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

  return (
    <div className="flex bg-background">
      {/* Section sidebar — sticky within the page scroll container */}
      <aside className="relative w-64 flex-shrink-0 sticky top-0 h-[calc(100vh-4rem)] border-r border-border/50 bg-card/30 backdrop-blur-sm flex flex-col">
        <div className="pointer-events-none absolute inset-y-0 right-0 w-px bg-gradient-to-b from-primary/30 via-border/60 to-transparent" />

        <div className="p-5 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/20">
              <Sparkles className="h-4.5 w-4.5" />
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-tight text-foreground">Settings</h2>
              <p className="text-[11px] text-muted-foreground">Configure your cinema</p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar px-3 py-2 space-y-1">
          <NavGroup title="Organization" sections={orgSections} isSectionDirty={isSectionDirty} first />
          <NavGroup title="Cinema Branch" sections={hallSections} isSectionDirty={isSectionDirty} />
          {visibleManagementSections.length > 0 && (
            <NavGroup title="Management" sections={visibleManagementSections} isSectionDirty={isSectionDirty} />
          )}
        </div>

        <div className="p-4 border-t border-border/50">
          <div className="flex items-start gap-2.5 rounded-xl border border-border/50 bg-muted/30 p-3">
            <Info className="h-3.5 w-3.5 shrink-0 mt-0.5 text-muted-foreground" />
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Changes are saved per section. Unsaved edits are marked with a dot.
            </p>
          </div>
        </div>
      </aside>

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

function NavGroup({ title, sections, isSectionDirty, first = false }) {
  return (
    <div className={`space-y-1.5 py-3 ${first ? "" : "border-t border-border/40"}`}>
      <h3 className="px-3 flex items-center gap-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
        <span className="h-1 w-1 rounded-full bg-muted-foreground/50" />
        {title}
      </h3>
      <nav className="space-y-0.5">
        {sections.map(({ path, label, icon, scope }) => {
          const IconComp = icon;
          const sectionKey = getSectionKey(path);
          const dirty = isSectionDirty(scope, sectionKey);
          return (
            <NavLink
              key={path}
              to={path}
              className={({ isActive }) =>
                `group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-colors duration-200 ${
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <Motion.div
                      layoutId="settings-nav-active"
                      className="absolute inset-0 rounded-xl bg-primary/15 ring-1 ring-primary/20"
                      transition={{ type: "spring", stiffness: 500, damping: 40 }}
                    />
                  )}
                  <IconComp className={`relative h-4 w-4 shrink-0 transition-colors ${isActive ? "text-primary" : dirty ? "text-amber-500" : ""}`} />
                  <span className="relative truncate flex-1">{label}</span>
                  {dirty && (
                    <span className="relative flex items-center">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-500 group-hover:hidden" title="Unsaved changes" />
                      <Badge
                        variant="outline"
                        className="hidden group-hover:inline-flex h-5 px-1.5 text-[9px] border-amber-500/30 text-amber-500 bg-amber-500/10"
                      >
                        unsaved
                      </Badge>
                    </span>
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>
    </div>
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
  };
  return map[path] || path;
}
