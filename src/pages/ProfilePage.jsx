import { Link } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { useHall } from "../context/HallContext"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { User, Mail, Phone, Building } from "lucide-react"

export const ProfilePage = () => {
  const { user, cinemaHall } = useAuth()
  const { activeHall } = useHall()

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 space-y-8">

      {/* Admin Profile */}
      <section>
        <h2 className="text-xl font-semibold text-foreground mb-1">Admin Profile</h2>
        <p className="text-sm text-muted-foreground mb-5">Your account information</p>

        <div className="bg-card border border-border rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
              <User className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-foreground">{user?.name}</p>
              <p className="text-xs text-muted-foreground capitalize">{user?.role}</p>
            </div>
          </div>
          <Separator />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-center gap-2 text-sm">
              <Mail className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <span className="text-foreground">{user?.email}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Phone className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <span className="text-foreground">{user?.phone || "—"}</span>
            </div>
          </div>
        </div>
      </section>

      <Separator />

      {/* Cinema Hall */}
      <section>
        <h2 className="text-xl font-semibold text-foreground mb-1">Cinema Hall</h2>
        <p className="text-sm text-muted-foreground mb-5">
          Manage your halls from the dedicated halls page
        </p>
        <div className="bg-card border border-border rounded-xl p-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
              <Building className="w-5 h-5 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-foreground truncate">
                {activeHall?.name ?? cinemaHall?.name ?? "No hall yet"}
              </p>
              <p className="text-xs text-muted-foreground truncate mt-0.5">
                {activeHall?.location ?? cinemaHall?.location ?? "—"}
                {(activeHall?.district || cinemaHall?.district) &&
                  ` · ${activeHall?.district ?? cinemaHall?.district}`}
              </p>
            </div>
          </div>
          <Button asChild variant="outline" size="sm" className="shrink-0">
            <Link to="/halls">Manage Halls →</Link>
          </Button>
        </div>
      </section>
    </div>
  )
}
