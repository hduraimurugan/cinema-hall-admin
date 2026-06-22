import { Ticket, Timer, Users, CalendarDays, Ban, Percent } from "lucide-react";
import { useSettings } from "@/context/SettingsContext";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { SettingsPageHeader } from "@/components/settings/SettingsPageHeader";
import { SettingsCard } from "@/components/settings/SettingsCard";
import { HALL_DEFAULTS } from "@/lib/settings/settingsDefaults";

export function BookingSettingsPage() {
  const { getSection, updateSection } = useSettings();
  const data = getSection("hall", "booking") || HALL_DEFAULTS.booking;

  const update = (field, value) => updateSection("hall", "booking", { [field]: value });
  const updateCancellation = (field, value) => {
    updateSection("hall", "booking", { cancellation: { ...(data.cancellation || {}), [field]: value } });
  };

  return (
    <div className="max-w-3xl mx-auto">
      <SettingsPageHeader
        icon={Ticket}
        title="Booking Settings"
        description="Seat hold duration, booking limits, and customer cancellation rules."
        scope="hall"
      />

      <div className="space-y-6">
        <SettingsCard
          icon={Timer}
          title="Seat Hold & Limits"
          description="Configure how long seats are held and the maximum booking size."
        >
          <div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label htmlFor="hold-minutes" className="text-sm font-medium flex items-center gap-2">
                  <Timer className="h-4 w-4 text-muted-foreground" />
                  Seat Hold Duration (minutes)
                </Label>
                <Input id="hold-minutes" type="number" min={1} max={30} value={data.hold_minutes ?? 5} onChange={e => update("hold_minutes", Number(e.target.value))} className="h-11" />
                <p className="text-xs text-muted-foreground">Currently {data.hold_minutes ?? 5} min. Shorter = better availability.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="max-seats" className="text-sm font-medium flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  Max Seats Per Booking
                </Label>
                <Input id="max-seats" type="number" min={1} max={20} value={data.max_seats_per_booking ?? 10} onChange={e => update("max_seats_per_booking", Number(e.target.value))} className="h-11" />
                <p className="text-xs text-muted-foreground">Maximum tickets a customer can book in one order.</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="advance-days" className="text-sm font-medium flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-muted-foreground" />
                Advance Booking Window (days)
              </Label>
              <Input id="advance-days" type="number" min={1} max={90} value={data.advance_booking_days ?? 7} onChange={e => update("advance_booking_days", Number(e.target.value))} className="h-11" />
              <p className="text-xs text-muted-foreground">How many days in advance customers can book tickets.</p>
            </div>
          </div>
        </SettingsCard>

        <SettingsCard
          icon={Ban}
          title="Cancellation"
          description="Configure customer-initiated cancellation rules."
        >
          <div className="space-y-5">
            <div className="flex items-start sm:items-center justify-between gap-4 rounded-xl bg-muted/30 p-4">
              <div className="space-y-1">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Ban className="h-4 w-4 text-destructive" />
                  Allow Customer Cancellation
                </Label>
                <p className="text-xs text-muted-foreground">Let customers cancel bookings from their account.</p>
              </div>
              <Switch checked={data.cancellation?.allowed !== false} onCheckedChange={v => updateCancellation("allowed", v)} />
            </div>

            {data.cancellation?.allowed !== false && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label htmlFor="cancel-window" className="text-sm font-medium">Cancellation Window (minutes before show)</Label>
                  <Input id="cancel-window" type="number" min={0} value={data.cancellation?.window_minutes ?? 120} onChange={e => updateCancellation("window_minutes", Number(e.target.value))} className="h-11" />
                  <p className="text-xs text-muted-foreground">0 = allow until showtime.</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="penalty" className="text-sm font-medium flex items-center gap-2">
                    <Percent className="h-4 w-4 text-muted-foreground" />
                    Cancellation Penalty (%)
                  </Label>
                  <Input id="penalty" type="number" min={0} max={100} value={data.cancellation?.penalty_percentage ?? 10} onChange={e => updateCancellation("penalty_percentage", Number(e.target.value))} className="h-11" />
                  <p className="text-xs text-muted-foreground">% of ticket price deducted on cancellation.</p>
                </div>
              </div>
            )}
          </div>
        </SettingsCard>
      </div>
    </div>
  );
}
