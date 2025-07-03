export const formatRole = (role) => {
  if (!role) return ""
  return role
    .replace(/([a-z])([A-Z])/g, '$1 $2')  // insert space before capital letters
    .replace(/^./, str => str.toUpperCase()) // capitalize first letter
}