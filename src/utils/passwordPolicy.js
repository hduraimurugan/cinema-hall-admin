/**
 * Password policy checks — shared between all auth forms.
 * Mirror of cinema-hall-api/utils/passwordPolicy.js for frontend validation.
 */
export const PASSWORD_POLICY_CHECKS = [
  { label: 'At least 8 characters',      test: (p) => p.length >= 8 },
  { label: 'One uppercase letter (A–Z)',  test: (p) => /[A-Z]/.test(p) },
  { label: 'One lowercase letter (a–z)', test: (p) => /[a-z]/.test(p) },
  { label: 'One number (0–9)',            test: (p) => /\d/.test(p) },
  { label: 'One special character',       test: (p) => /[!@#$%^&*()\-_=+\[\]{};':"\\|,.<>/?`~]/.test(p) },
]

export const validatePassword = (password) => {
  for (const check of PASSWORD_POLICY_CHECKS) {
    if (!check.test(password)) return { valid: false, message: check.label }
  }
  return { valid: true }
}
