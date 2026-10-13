import { prisma } from "../db.js";
import { HttpError } from "../lib/httpError.js";
import { verifyPassword } from "../lib/passwords.js";
import { readSignedSession, sessionExpiry, signSessionToken } from "../lib/sessions.js";
import { publicUser } from "../lib/serializers.js";

export async function login(email: string, password: string) {
  const user = await prisma.user.findUnique({
    where: { email: email.trim().toLowerCase() },
  });
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    throw new HttpError(401, "Email or password is incorrect.");
  }

  const expiresAt = sessionExpiry();
  const token = signSessionToken(user.id, expiresAt);
  await prisma.session.create({
    data: {
      token,
      userId: user.id,
      expiresAt,
    },
  });

  return { token, user: publicUser(user) };
}

export async function logout(token: string | undefined) {
  if (!token) return;
  await prisma.session.deleteMany({ where: { token } });
}

export async function userFromToken(token: string | undefined) {
  if (!token) return null;

  const signed = readSignedSession(token);
  if (signed) {
    const user = await prisma.user.findUnique({ where: { id: signed.userId } });
    return user ? publicUser(user) : null;
  }

  const session = await prisma.session.findUnique({
    where: { token },
    include: { user: true },
  });
  if (!session || session.expiresAt < new Date()) {
    if (session) await prisma.session.delete({ where: { id: session.id } });
    return null;
  }
  return publicUser(session.user);
}
