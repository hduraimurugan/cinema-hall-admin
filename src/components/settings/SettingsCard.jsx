import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function SettingsCard({ icon: Icon, title, description, children, className = "" }) {
  return (
    <Card className={`overflow-hidden border-border/60 bg-card/80 backdrop-blur-sm shadow-sm hover:shadow-md transition-shadow duration-300 ${className}`}>
      {/* Without a title or icon the header is an empty banded strip, so skip it. */}
      {(title || Icon) && (
      <CardHeader className="border-b border-border/40 bg-muted/20 px-6 py-5">
        <div className="flex items-center gap-3">
          {Icon && (
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary/70 text-secondary-foreground ring-1 ring-border/50">
              <Icon className="h-4 w-4" />
            </div>
          )}
          <div className="space-y-0.5">
            <CardTitle className="text-base font-semibold">{title}</CardTitle>
            {description && <CardDescription className="text-xs leading-relaxed">{description}</CardDescription>}
          </div>
        </div>
      </CardHeader>
      )}
      <CardContent className="p-6">
        {children}
      </CardContent>
    </Card>
  );
}
