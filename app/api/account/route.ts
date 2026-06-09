import { authError, authOk, destroySession, getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function DELETE() {
  const user = await getCurrentUser();

  if (!user) {
    return authError("UNAUTHORIZED", "Authentication required", 401);
  }

  await prisma.user.delete({ where: { id: user.id } });
  await destroySession();

  return authOk({ deleted: true });
}
