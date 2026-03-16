import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { settingsAPI } from "@/services/api"
import { toast } from "sonner"

export const SettingsPage = () => {
  const [convenienceFee, setConvenienceFee] = useState("")
  const [gstPercentage, setGstPercentage] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    settingsAPI.getSettings()
      .then(data => {
        setConvenienceFee(String(data.convenience_fee_per_ticket ?? 15))
        setGstPercentage(String(data.gst_percentage ?? 18))
      })
      .catch(() => toast.error("Failed to load settings"))
      .finally(() => setLoading(false))
  }, [])

  const handleSave = async () => {
    const fee = parseFloat(convenienceFee)
    const gst = parseFloat(gstPercentage)

    if (isNaN(fee) || fee < 0) {
      toast.error("Enter a valid convenience fee")
      return
    }
    if (isNaN(gst) || gst < 0 || gst > 100) {
      toast.error("Enter a valid GST percentage (0–100)")
      return
    }

    try {
      setSaving(true)
      await settingsAPI.updateSettings({
        convenience_fee_per_ticket: fee,
        gst_percentage: gst,
      })
      toast.success("Settings saved successfully")
    } catch (err) {
      toast.error(err?.error || "Failed to save settings")
    } finally {
      setSaving(false)
    }
  }

  const previewConvFee = parseFloat(convenienceFee) || 0
  const previewGst = parseFloat(gstPercentage) || 0
  const previewGstAmount = +(previewConvFee * (previewGst / 100)).toFixed(2)
  const previewTotal = previewConvFee + previewGstAmount

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8  space-y-8">
      <div>
        <h2 className="text-xl font-semibold">Settings</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Configure booking fees applied to all customer orders.
        </p>
      </div>

      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle className="text-base">Booking Fees</CardTitle>
          <CardDescription>
            Convenience fee and GST are applied per ticket on every booking.
            GST is calculated only on the convenience fee.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="conv-fee">Convenience Fee (₹ per ticket)</Label>
                <Input
                  id="conv-fee"
                  type="number"
                  min="0"
                  step="0.01"
                  value={convenienceFee}
                  onChange={e => setConvenienceFee(e.target.value)}
                  placeholder="e.g. 15"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="gst">GST Percentage (%)</Label>
                <Input
                  id="gst"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={gstPercentage}
                  onChange={e => setGstPercentage(e.target.value)}
                  placeholder="e.g. 18"
                />
              </div>

              {/* Live preview */}
              <div className="rounded-lg bg-secondary/40 px-4 py-3 text-sm space-y-1.5">
                <p className="font-medium text-xs text-muted-foreground uppercase tracking-wide mb-2">
                  Preview (per ticket)
                </p>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Convenience fee</span>
                  <span>₹{previewConvFee.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">GST ({previewGst}%)</span>
                  <span>₹{previewGstAmount.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between font-semibold border-t border-border pt-1.5 mt-1">
                  <span>Total per ticket</span>
                  <span>₹{previewTotal.toLocaleString('en-IN')}</span>
                </div>
              </div>

              <Button onClick={handleSave} disabled={saving} className="w-full">
                {saving ? "Saving..." : "Save Settings"}
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
