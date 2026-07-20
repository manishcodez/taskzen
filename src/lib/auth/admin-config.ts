export function getAdminUserEmail(): string | null {
  const email = process.env.ADMIN_USER_EMAIL?.trim().toLowerCase();
  return email || null;
}

export function isAdminEmail(email: string): boolean {
  const adminEmail = getAdminUserEmail();
  if (!adminEmail) {
    return false;
  }

  return email.trim().toLowerCase() === adminEmail;
}
