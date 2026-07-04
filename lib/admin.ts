export function isAdminPasswordRequired() {
  return Boolean(process.env.ADMIN_PASSWORD?.trim());
}

export function verifyAdminPassword(password?: string | null) {
  const configured = process.env.ADMIN_PASSWORD?.trim();

  if (!configured) {
    return true;
  }

  return password === configured;
}
