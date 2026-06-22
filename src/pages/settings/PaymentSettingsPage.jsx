import { CreditCard, Receipt, Percent, Calculator, Lock } from "lucide-react";
import { useSettings } from "@/context/SettingsContext";
import { useAuth } from "@/context/AuthContext";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { SettingsPageHeader } from "@/components/settings/SettingsPageHeader";
import { SettingsCard } from "@/components/settings/SettingsCard";
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
      <div className="max-w-3xl mx-auto">
        <SettingsPageHeader
          icon={CreditCard}
          title="Payment Settings"
          description="Booking fees and tax configuration applied to all customer orders."
          scope="org"
        />
        <div className="rounded-2xl border border-border/60 bg-card/80 p-6 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted/60 mb-4">
            <Lock className="h-5 w-5 text-muted-foreground" />
          </div>
          <h3 className="text-base font-semibold mb-1">Restricted to Super Admins</h3>
          <p className="text-sm text-muted-foreground">Only Super Admins can modify payment settings.</p>
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
            <div className="rounded-xl bg-muted/40 p-4">
              <p className="text-xs text-muted-foreground mb-1">Fee Model</p>
              <p className="text-sm font-medium">{data.convenience_fee?.model || "per_ticket"}</p>
            </div>
            <div className="rounded-xl bg-muted/40 p-4">
              <p className="text-xs text-muted-foreground mb-1">Amount</p>
              <p className="text-sm font-medium">₹{feeAmount.toLocaleString("en-IN")}</p>
            </div>
            <div className="rounded-xl bg-muted/40 p-4">
              <p className="text-xs text-muted-foreground mb-1">GST</p>
              <p className="text-sm font-medium">{gstPct}%</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <SettingsPageHeader
        icon={CreditCard}
        title="Payment Settings"
        description="Booking fees and tax configuration applied to all customer orders."
        scope="org"
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SettingsCard
          icon={Receipt}
          title="Convenience Fee"
          description="Flat fee added to every ticket. GST is applied on this fee, not on seat prices."
        >
          <div className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="fee-model" className="text-sm font-medium">Fee Model</Label>
              <Select value={data.convenience_fee?.model || "per_ticket"} onValueChange={v => updateFee("model", v)}>
                <SelectTrigger id="fee-model" className="h-11"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="per_ticket">Per Ticket (flat)</SelectItem>
                  <SelectItem value="per_booking">Per Booking</SelectItem>
                  <SelectItem value="percentage">Percentage of Seat Price</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fee-amount" className="text-sm font-medium">Amount (₹)</Label>
              <Input id="fee-amount" type="number" min={0} step={0.01} value={feeAmount} onChange={e => updateFee("amount", Number(e.target.value))} className="h-11" />
            </div>
          </div>
        </SettingsCard>

        <div className="space-y-6">
          <SettingsCard
            icon={Percent}
            title="GST"
            description="Goods & Services Tax applied on the convenience fee."
          >
            <div className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="gst" className="text-sm font-medium">GST Percentage (%)</Label>
                <Input id="gst" type="number" min={0} max={100} step={0.01} value={gstPct} onChange={e => update("gst_percentage", Number(e.target.value))} className="h-11" />
              </div>
            </div>
          </SettingsCard>

          <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 to-primary/5 p-5 shadow-lg shadow-primary/5">
            <div className="flex items-center gap-2 mb-4">
              <Calculator className="h-4 w-4 text-primary" />
              <p className="text-xs font-semibold text-primary uppercase tracking-wider">Per-Ticket Preview</p>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Convenience Fee</span>
                <span>₹{feeAmount.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>GST ({gstPct}%)</span>
                <span>₹{gstAmount.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between font-bold text-foreground border-t border-primary/20 pt-2 mt-2">
                <span>Total per ticket</span>
                <span>₹{total.toLocaleString("en-IN")}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
