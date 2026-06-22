import { useSettings } from "@/context/SettingsContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { HALL_DEFAULTS } from "@/lib/settings/settingsDefaults";

export function BookingSettingsPage() {
  const { getSection, updateSection } = useSettings();
  const data = getSection("hall", "booking") || HALL_DEFAULTS.booking;

  const update = (field, value) => updateSection("hall", "booking", { [field]: value });
  const updateCancellation = (field, value) => {
    updateSection("hall", "booking", { cancellation: { ...(data.cancellation || {}), [field]: value } });
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-lg font-semibold">Booking Settings</h2>
        <p className="text-sm text-muted-foreground">Seat hold duration, booking limits, and cancellation rules.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Seat Hold & Limits</CardTitle>
          <CardDescription>Configure how long seats are held and maximum booking size.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="hold-minutes">Seat Hold Duration (minutes)</Label>
              <Input id="hold-minutes" type="number" min={1} max={30} value={data.hold_minutes ?? 5} onChange={e => update("hold_minutes", Number(e.target.value))} />
              <p className="text-xs text-muted-foreground">Currently {data.hold_minutes ?? 5} min. Shorter = better availability.</p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="max-seats">Max Seats Per Booking</Label>
              <Input id="max-seats" type="number" min={1} max={20} value={data.max_seats_per_booking ?? 10} onChange={e => update("max_seats_per_booking", Number(e.target.value))} />
              <p className="text-xs text-muted-foreground">Maximum tickets a customer can book in one order.</p>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="advance-days">Advance Booking Window (days)</Label>
            <Input id="advance-days" type="number" min={1} max={90} value={data.advance_booking_days ?? 7} onChange={e => update("advance_booking_days", Number(e.target.value))} />
            <p className="text-xs text-muted-foreground">How many days in advance customers can book tickets.</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Cancellation</CardTitle>
          <CardDescription>Configure customer-initiated cancellation rules.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm">Allow Customer Cancellation</Label>
              <p className="text-xs text-muted-foreground">Let customers cancel bookings from their account.</p>
            </div>
            <Switch checked={data.cancellation?.allowed !== false} onValueChange={v => updateCancellation("allowed", v)} />
          </div>

          {data.cancellation?.allowed !== false && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="cancel-window">Cancellation Window (minutes before show)</Label>
                  <Input id="cancel-window" type="number" min={0} value={data.cancellation?.window_minutes ?? 120} onChange={e => updateCancellation("window_minutes", Number(e.target.value))} />
                  <p className="text-xs text-muted-foreground">0 = allow until showtime.</p>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="penalty">Cancellation Penalty (%)</Label>
                  <Input id="penalty" type="number" min={0} max={100} value={data.cancellation?.penalty_percentage ?? 10} onChange={e => updateCancellation("penalty_percentage", Number(e.target.value))} />
                  <p className="text-xs text-muted-foreground">% of ticket price deducted on cancellation.</p>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
