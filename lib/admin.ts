export function isAdminPasswordRequired() {
  return Boolean(process.env.ADMIN_LOGIN?.trim() || process.env.ADMIN_PASSWORD?.trim());
}

export function verifyAdminCredentials(login?: string | null, password?: string | null) {
  const configuredLogin = process.env.ADMIN_LOGIN?.trim();
  const configuredPassword = process.env.ADMIN_PASSWORD?.trim();

  if (!configuredLogin && !configuredPassword) {
    return true;
  }

  const loginOk = configuredLogin ? login === configuredLogin : true;
  const passwordOk = configuredPassword ? password === configuredPassword : true;

  return loginOk && passwordOk;
}

export function verifyAdminPassword(password?: string | null) {
  return verifyAdminCredentials(null, password);
}
