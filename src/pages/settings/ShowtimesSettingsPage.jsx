import { useSettings } from "@/context/SettingsContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { HALL_DEFAULTS } from "@/lib/settings/settingsDefaults";

export function ShowtimesSettingsPage() {
  const { getSection, updateSection } = useSettings();
  const data = getSection("hall", "showtimes") || HALL_DEFAULTS.showtimes;

  const update = (field, value) => updateSection("hall", "showtimes", { [field]: value });

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-lg font-semibold">Showtimes Settings</h2>
        <p className="text-sm text-muted-foreground">Default behavior for show scheduling and status transitions.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Scheduling Defaults</CardTitle>
          <CardDescription>Controls how new shows are scheduled by default.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="buffer">Default Buffer (minutes)</Label>
              <Input id="buffer" type="number" min={0} value={data.default_buffer_minutes ?? 15} onChange={e => update("default_buffer_minutes", Number(e.target.value))} />
              <p className="text-xs text-muted-foreground">Gap between consecutive shows in the same screen.</p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lang">Default Language Version</Label>
              <Select value={data.default_language_version || "Original"} onValueChange={v => update("default_language_version", v)}>
                <SelectTrigger id="lang"><SelectValue /></SelectTrigger>
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

          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm">Prevent Overlapping Shows</Label>
              <p className="text-xs text-muted-foreground">Reject scheduling if times overlap on the same screen.</p>
            </div>
            <Switch checked={data.prevent_overlap !== false} onCheckedChange={v => update("prevent_overlap", v)} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Status Automation</CardTitle>
          <CardDescription>Auto-transition show status from scheduled to booking_started to in_progress.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm">Auto Status Transitions</Label>
              <p className="text-xs text-muted-foreground">Let the system automatically advance show statuses based on time.</p>
            </div>
            <Switch checked={data.auto_status_transitions !== false} onValueChange={v => update("auto_status_transitions", v)} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="advance-days">Advance Booking (days)</Label>
              <Input id="advance-days" type="number" min={1} max={90} value={data.advance_booking_days ?? 7} onChange={e => update("advance_booking_days", Number(e.target.value))} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="open-offset">Booking Open Offset (min)</Label>
              <Input id="open-offset" type="number" min={0} value={data.booking_open_offset_minutes ?? 0} onChange={e => update("booking_open_offset_minutes", Number(e.target.value))} />
              <p className="text-xs text-muted-foreground">Minutes before showtime when booking opens. 0 = when show is created.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
