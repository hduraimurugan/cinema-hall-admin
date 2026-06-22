import { Badge } from "@/components/ui/badge";

export function SettingsPageHeader({ icon: Icon, title, description, scope, scopeLabel }) {
  const scopeConfig = {
    org: { label: scopeLabel || "Organization", variant: "default", className: "bg-primary/10 text-primary border-primary/20 hover:bg-primary/15" },
    hall: { label: scopeLabel || "Cinema Branch", variant: "default", className: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/15" },
    user: { label: scopeLabel || "Personal", variant: "default", className: "bg-violet-500/10 text-violet-500 border-violet-500/20 hover:bg-violet-500/15" },
  };
  const scopeCfg = scope ? scopeConfig[scope] : null;

  return (
    <div className="mb-8">
      <div className="flex items-start gap-4">
        {Icon && (
          <div className="hidden sm:flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 text-primary ring-1 ring-primary/20 shadow-lg shadow-primary/5">
            <Icon className="h-5.5 w-5.5" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2.5 mb-1.5">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">{title}</h1>
            {scopeCfg && (
              <Badge variant="outline" className={`text-[10px] font-semibold uppercase tracking-wider ${scopeCfg.className}`}>
                {scopeCfg.label}
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed">{description}</p>
        </div>
      </div>
    </div>
  );
}
