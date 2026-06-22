import { useSettings } from "@/context/SettingsContext";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ORG_DEFAULTS } from "@/lib/settings/settingsDefaults";

export function PaymentSettingsPage() {
  const { getSection, updateSection } = useSettings();
  const { isSuperAdmin } = useAuth();
  const data = getSection("org", "payment") || ORG_DEFAULTS.payment;

  const update = (field, value) => updateSection("org", "payment", { [field]: value });
  const updateFee = (field, value) => {
    const fee = { ...(data.convenience_fee || ORG_DEFAULTS.payment.convenience_fee), [field]: value };
    update("convenience_fee", fee);
  };

  const feeAmount = data.convenience_fee?.amount ?? 15;
  const gstPct = data.gst_percentage ?? 18;
  const gstAmount = +(feeAmount * (gstPct / 100)).toFixed(2);
  const total = feeAmount + gstAmount;

  if (!isSuperAdmin) {
    return (
      <div className="space-y-6 max-w-2xl">
        <div>
          <h2 className="text-lg font-semibold">Payment Settings</h2>
          <p className="text-sm text-muted-foreground">Booking fees and tax configuration.</p>
        </div>
        <Card>
          <CardContent className="pt-6 space-y-3">
            <div className="space-y-1.5">
              <Label>Convenience Fee Model</Label>
              <p className="text-sm px-3 py-2 rounded-md border border-border bg-secondary/30">{data.convenience_fee?.model || "per_ticket"}</p>
            </div>
            <div className="space-y-1.5">
              <Label>Amount (₹)</Label>
              <p className="text-sm px-3 py-2 rounded-md border border-border bg-secondary/30">₹{feeAmount.toLocaleString("en-IN")}</p>
            </div>
            <div className="space-y-1.5">
              <Label>GST (%)</Label>
              <p className="text-sm px-3 py-2 rounded-md border border-border bg-secondary/30">{gstPct}%</p>
            </div>
            <p className="text-xs text-muted-foreground">Only Super Admins can modify payment settings.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-lg font-semibold">Payment Settings</h2>
        <p className="text-sm text-muted-foreground">Booking fees and tax configuration applied to all customer orders.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Convenience Fee</CardTitle>
          <CardDescription>Flat fee added to every ticket. GST is applied on this fee, not on seat prices.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="fee-model">Fee Model</Label>
            <Select value={data.convenience_fee?.model || "per_ticket"} onValueChange={v => updateFee("model", v)}>
              <SelectTrigger id="fee-model"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="per_ticket">Per Ticket (flat)</SelectItem>
                <SelectItem value="per_booking">Per Booking</SelectItem>
                <SelectItem value="percentage">Percentage of Seat Price</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="fee-amount">Amount (₹)</Label>
            <Input id="fee-amount" type="number" min={0} step={0.01} value={feeAmount} onChange={e => updateFee("amount", Number(e.target.value))} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">GST</CardTitle>
          <CardDescription>Goods & Services Tax applied on the convenience fee.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="gst">GST Percentage (%)</Label>
            <Input id="gst" type="number" min={0} max={100} step={0.01} value={gstPct} onChange={e => update("gst_percentage", Number(e.target.value))} />
          </div>

          {/* Preview */}
          <div className="rounded-lg bg-secondary/40 px-4 py-3 text-sm space-y-1.5">
            <p className="font-medium text-xs text-muted-foreground uppercase tracking-wide mb-2">Per-Ticket Preview</p>
            <div className="flex justify-between"><span className="text-muted-foreground">Convenience Fee</span><span>₹{feeAmount.toLocaleString("en-IN")}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">GST ({gstPct}%)</span><span>₹{gstAmount.toLocaleString("en-IN")}</span></div>
            <div className="flex justify-between font-semibold border-t border-border pt-1.5 mt-1"><span>Total per ticket</span><span>₹{total.toLocaleString("en-IN")}</span></div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
