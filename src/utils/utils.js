  export const genres = ["Action", "Comedy", "Drama", "Mystery", "Fantasy" ,"Period" ,"Musical", "Horror", "Romance", "Thriller", "Sci-Fi", "Adventure"]
  export const languages = ["Tamil", "English", "Hindi", "Telugu", "Malayalam", "Kannada","Marathi"]

export const formatRole = (role) => {
  if (!role) return ""
  return role
    .replace(/([a-z])([A-Z])/g, '$1 $2')  // insert space before capital letters
    .replace(/^./, str => str.toUpperCase()) // capitalize first letter
}

// Platform superAdmins should always read as "Super Admin", regardless of
// their team roleKey (e.g. seeded as "owner" on a hall membership row).
// Everyone else shows their actual assigned role (roleKey), not the
// account-level `role` field, so it matches what's shown in the sidebar.
export const getDisplayRole = (user) => {
  if (!user) return ""
  if (user.role === 'superAdmin') return 'superAdmin'
  return user.roleKey || user.role
}

export const getRoleBadgeClass = (displayRole) => {
  return displayRole === "owner" || displayRole === "superAdmin"
    ? "bg-primary/10 text-primary"
    : "bg-amber-500/10 text-amber-500"
}

export const formatStatus = (status) => {
  if (!status) return ""
  return status
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
}

export const getStatusColor = (status) => {
  switch (status) {
    case "now_showing":
      return "bg-green-600 text-white"
    case "upcoming":
      return "bg-yellow-500 text-gray-950 "
    case "ended":
      return "bg-red-500 text-white"
    default:
      return "bg-neutral-400"
  }
}
