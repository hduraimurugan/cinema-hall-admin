import { useSettings } from "@/context/SettingsContext";
import { useHall } from "@/context/HallContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { HALL_DEFAULTS } from "@/lib/settings/settingsDefaults";

export function CinemaProfilePage() {
  const { getSection, updateSection } = useSettings();
  const { activeHall } = useHall();
  const data = getSection("hall", "cinema_profile") || HALL_DEFAULTS.cinema_profile;

  const update = (field, value) => updateSection("hall", "cinema_profile", { [field]: value });

  if (!activeHall) {
    return <p className="text-sm text-muted-foreground p-6">Select a cinema hall to manage its profile.</p>;
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-lg font-semibold">Cinema Profile</h2>
        <p className="text-sm text-muted-foreground">
          Manage the public profile for <span className="font-medium text-foreground">{activeHall.name}</span>.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Branch Details</CardTitle>
          <CardDescription>Name, location, and contact information visible to customers.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="hall-name">Cinema Name</Label>
            <Input id="hall-name" value={data.name || ""} onChange={e => update("name", e.target.value)} placeholder={activeHall.name} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="location">Address / Location</Label>
            <Input id="location" value={data.location || ""} onChange={e => update("location", e.target.value)} placeholder={activeHall.location} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="district">District</Label>
              <Input id="district" value={data.district || ""} onChange={e => update("district", e.target.value)} placeholder={activeHall.district || "e.g. Chennai"} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="state">State</Label>
              <Input id="state" value={data.state || ""} onChange={e => update("state", e.target.value)} placeholder={activeHall.state || "e.g. Tamil Nadu"} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" value={data.phone || ""} onChange={e => update("phone", e.target.value)} placeholder="+91..." />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="hours">Operating Hours</Label>
              <Input id="hours" value={data.operating_hours ? `${data.operating_hours.open} – ${data.operating_hours.close}` : ""} onChange={() => {}} readOnly placeholder="09:00 – 23:00" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" value={data.description || ""} onChange={e => update("description", e.target.value)} placeholder="Describe the cinema experience..." rows={3} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
