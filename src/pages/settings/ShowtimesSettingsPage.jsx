import { Calendar, Timer, Languages, ShieldCheck, Play, CalendarDays } from "lucide-react";
import { useSettings } from "@/context/SettingsContext";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SettingsPageHeader } from "@/components/settings/SettingsPageHeader";
import { SettingsCard } from "@/components/settings/SettingsCard";
import { HALL_DEFAULTS } from "@/lib/settings/settingsDefaults";

export function ShowtimesSettingsPage() {
  const { getSection, updateSection } = useSettings();
  const data = getSection("hall", "showtimes") || HALL_DEFAULTS.showtimes;

  const update = (field, value) => updateSection("hall", "showtimes", { [field]: value });

  return (
    <div className="max-w-3xl mx-auto">
      <SettingsPageHeader
        icon={Calendar}
        title="Showtimes Settings"
        description="Default behavior for show scheduling, overlap prevention, and status transitions."
        scope="hall"
      />

      <div className="space-y-6">
        <SettingsCard
          icon={Timer}
          title="Scheduling Defaults"
          description="Controls how new shows are scheduled by default."
        >
          <div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label htmlFor="buffer" className="text-sm font-medium">Default Buffer (minutes)</Label>
                <Input id="buffer" type="number" min={0} value={data.default_buffer_minutes ?? 15} onChange={e => update("default_buffer_minutes", Number(e.target.value))} className="h-11" />
                <p className="text-xs text-muted-foreground">Gap between consecutive shows in the same screen.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="lang" className="text-sm font-medium">Default Language Version</Label>
                <div className="flex items-center gap-3">
                  <Languages className="h-4 w-4 text-muted-foreground" />
                  <Select value={data.default_language_version || "Original"} onValueChange={v => update("default_language_version", v)}>
                    <SelectTrigger id="lang" className="h-11 flex-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Original">Original</SelectItem>
                      <SelectItem value="Hindi">Hindi</SelectItem>
                      <SelectItem value="Tamil">Tamil</SelectItem>
                      <SelectItem value="Telugu">Telugu</SelectItem>
                      <SelectItem value="Malayalam">Malayalam</SelectItem>
                      <SelectItem value="Kannada">Kannada</SelectItem>
                      <SelectItem value="English">English</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="flex items-start sm:items-center justify-between gap-4 rounded-xl bg-muted/30 p-4">
              <div className="space-y-1">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-500" />
                  Prevent Overlapping Shows
                </Label>
                <p className="text-xs text-muted-foreground">Reject scheduling if times overlap on the same screen.</p>
              </div>
              <Switch checked={data.prevent_overlap !== false} onCheckedChange={v => update("prevent_overlap", v)} />
            </div>
          </div>
        </SettingsCard>

        <SettingsCard
          icon={Play}
          title="Status Automation"
          description="Auto-transition show status from scheduled to booking_started to in_progress."
        >
          <div className="space-y-5">
            <div className="flex items-start sm:items-center justify-between gap-4 rounded-xl bg-muted/30 p-4">
              <div className="space-y-1">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Play className="h-4 w-4 text-primary" />
                  Auto Status Transitions
                </Label>
                <p className="text-xs text-muted-foreground">Let the system automatically advance show statuses based on time.</p>
              </div>
              <Switch checked={data.auto_status_transitions !== false} onCheckedChange={v => update("auto_status_transitions", v)} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label htmlFor="advance-days" className="text-sm font-medium flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-muted-foreground" />
                  Advance Booking (days)
                </Label>
                <Input id="advance-days" type="number" min={1} max={90} value={data.advance_booking_days ?? 7} onChange={e => update("advance_booking_days", Number(e.target.value))} className="h-11" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="open-offset" className="text-sm font-medium">Booking Open Offset (min)</Label>
                <Input id="open-offset" type="number" min={0} value={data.booking_open_offset_minutes ?? 0} onChange={e => update("booking_open_offset_minutes", Number(e.target.value))} className="h-11" />
                <p className="text-xs text-muted-foreground">Minutes before showtime when booking opens. 0 = when show is created.</p>
              </div>
            </div>
          </div>
        </SettingsCard>
      </div>
    </div>
  );
}
