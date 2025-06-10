export function isValidEmail(email?: string): boolean {
  if (email === undefined || email === null || email === "") {
    return false
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}
