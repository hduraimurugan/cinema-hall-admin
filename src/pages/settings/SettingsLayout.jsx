import { NavLink, Outlet, useLocation, Navigate } from "react-router-dom";
import {
  Settings, Building2, Calendar, Ticket, CreditCard,
  Sparkles, Save
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useSettings } from "@/context/SettingsContext";
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

export function SettingsLayout() {
  const location = useLocation();
  const { user } = useAuth();
  const { isSectionDirty, saveSection, isSaving } = useSettings();

  const currentPath = location.pathname.split("/").pop() || "general";
  const allSections = [...orgSections, ...hallSections];
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
      <aside className="w-64 flex-shrink-0 sticky top-0 h-[calc(100vh-4rem)] border-r border-border/50 bg-card/30 backdrop-blur-sm flex flex-col">
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

        <div className="flex-1 overflow-y-auto custom-scrollbar px-3 py-2 space-y-5">
          <NavGroup title="Organization" sections={orgSections} isSectionDirty={isSectionDirty} />
          <NavGroup title="Cinema Branch" sections={hallSections} isSectionDirty={isSectionDirty} />
        </div>

        <div className="p-4 border-t border-border/50">
          <div className="rounded-xl bg-muted/40 p-3 space-y-2">
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Changes are saved per section. Unsaved edits are marked with a badge.
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

function NavGroup({ title, sections, isSectionDirty }) {
  return (
    <div className="space-y-1.5">
      <h3 className="px-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
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
                `group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-all duration-200 ${
                  isActive
                    ? "bg-primary/10 text-primary shadow-[inset_2px_0_0_0_hsl(var(--primary))]"
                    : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                }`
              }
            >
              <IconComp className={`h-4 w-4 shrink-0 transition-colors ${dirty ? "text-amber-500" : ""}`} />
              <span className="truncate flex-1">{label}</span>
              {dirty && (
                <Badge variant="outline" className="h-5 px-1.5 text-[9px] border-amber-500/30 text-amber-500 bg-amber-500/10 hover:bg-amber-500/15">
                  unsaved
                </Badge>
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
  };
  return map[path] || path;
}
