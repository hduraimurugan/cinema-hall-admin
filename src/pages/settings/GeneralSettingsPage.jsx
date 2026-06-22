import { useSettings } from "@/context/SettingsContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader } from "@/components/Loader";
import { ORG_DEFAULTS } from "@/lib/settings/settingsDefaults";

export function GeneralSettingsPage() {
  const { orgSettings, getSection, updateSection } = useSettings();
  const data = getSection("org", "general") || ORG_DEFAULTS.general;

  const update = (field, value) => updateSection("org", "general", { [field]: value });

  if (orgSettings.loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader />
      </div>
    );
  }

  if (orgSettings.error) {
    return (
      <div className="space-y-4 max-w-2xl">
        <Alert variant="destructive">
          <AlertDescription>{orgSettings.error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-lg font-semibold">General Settings</h2>
        <p className="text-sm text-muted-foreground">Platform identity, timezone, and regional defaults.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Organization</CardTitle>
          <CardDescription>These settings apply across all cinema branches.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="org-name">Organization Name</Label>
            <Input id="org-name" value={data.org_name || ""} onChange={e => update("org_name", e.target.value)} placeholder="e.g. CineMax Theatres" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="timezone">Default Timezone</Label>
              <Select value={data.timezone || "Asia/Kolkata"} onValueChange={v => update("timezone", v)}>
                <SelectTrigger id="timezone"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Asia/Kolkata">India (IST, +05:30)</SelectItem>
                  <SelectItem value="Asia/Dubai">UAE (GST, +04:00)</SelectItem>
                  <SelectItem value="America/New_York">US Eastern</SelectItem>
                  <SelectItem value="America/Chicago">US Central</SelectItem>
                  <SelectItem value="America/Los_Angeles">US Pacific</SelectItem>
                  <SelectItem value="Europe/London">UK (GMT)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="currency">Default Currency</Label>
              <Select value={data.currency || "INR"} onValueChange={v => update("currency", v)}>
                <SelectTrigger id="currency"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="INR">₹ Indian Rupee</SelectItem>
                  <SelectItem value="USD">$ US Dollar</SelectItem>
                  <SelectItem value="AED">AED UAE Dirham</SelectItem>
                  <SelectItem value="GBP">£ British Pound</SelectItem>
                  <SelectItem value="EUR">€ Euro</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="language">Default Language</Label>
            <Select value={data.language || "en"} onValueChange={v => update("language", v)}>
              <SelectTrigger id="language"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="hi">Hindi</SelectItem>
                <SelectItem value="ta">Tamil</SelectItem>
                <SelectItem value="te">Telugu</SelectItem>
                <SelectItem value="ml">Malayalam</SelectItem>
                <SelectItem value="kn">Kannada</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
