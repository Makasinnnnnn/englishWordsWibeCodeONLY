import { authError, authOk, destroyAllUserSessions, destroySession, getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST() {
  const user = await getCurrentUser();

  if (!user) {
    await destroySession();
    return authError("UNAUTHORIZED", "Authentication required", 401);
  }

  await destroyAllUserSessions(user.id);
  await destroySession();

  return authOk({ loggedOut: true });
}
