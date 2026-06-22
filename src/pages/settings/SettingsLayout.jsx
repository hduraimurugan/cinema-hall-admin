import { NavLink, Outlet, useLocation, Navigate } from "react-router-dom";
import {
  Settings, Building2, Calendar, Ticket, CreditCard,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useSettings } from "@/context/SettingsContext";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

const sections = [
  { path: "general",         label: "General",      icon: Settings,   scope: "org" },
  { path: "cinema-profile",  label: "Cinema Profile",icon: Building2,  scope: "hall" },
  { path: "showtimes",       label: "Showtimes",     icon: Calendar,   scope: "hall" },
  { path: "booking",         label: "Booking",       icon: Ticket,     scope: "hall" },
  { path: "payment",         label: "Payment",       icon: CreditCard, scope: "org" },
];

export function SettingsLayout() {
  const location = useLocation();
  const { user } = useAuth();
  const { isSectionDirty, saveSection, isSaving } = useSettings();

  const currentPath = location.pathname.split("/").pop() || "general";
  const currentSection = sections.find(s => s.path === currentPath);

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
    <div className="flex h-full">
      {/* Section sidebar */}
      <aside className="w-52 flex-shrink-0 border-r bg-background p-3 space-y-3">
        <div className="px-2">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Settings</h3>
        </div>
        <nav className="space-y-0.5">
          {sections.map(({ path, label, icon }) => {
            const IconComp = icon;
            const sectionKey = getSectionKey(path);
            const scope = sections.find(s => s.path === path)?.scope || "org";
            const dirty = isSectionDirty(scope, sectionKey);
            return (
              <NavLink
                key={path}
                to={path}
                className={({ isActive }) =>
                  `group flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-[13px] font-medium transition-all duration-200 ${
                    isActive
                      ? "bg-primary/10 text-primary border-l-2 border-primary"
                      : "text-muted-foreground hover:bg-muted/60 hover:text-foreground border-l-2 border-transparent"
                  }`
                }
              >
                <IconComp className="size-4 shrink-0" />
                <span className="truncate">{label}</span>
                {dirty && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-amber-500" />}
              </NavLink>
            );
          })}
        </nav>

        <Separator />

        {/* Save button */}
        <div className="px-1">
          <Button
            size="sm"
            className="w-full"
            disabled={!currentSectionDirty || currentSectionSaving}
            onClick={handleSave}
          >
            {currentSectionSaving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </aside>

      {/* Section content */}
      <main className="flex-1 min-w-0 overflow-y-auto p-6">
        <Outlet />
      </main>
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
