import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare, hashSync } from "bcryptjs";
import { randomUUID } from "node:crypto";
import { authConfig } from "@/auth.config";
import { prisma } from "@/lib/db/prisma";
import { loginSchema } from "@/lib/validations/auth";
import {
  buildLoginKeys,
  clearEmailFailures,
  getClientIp,
  isLoginBlocked,
  recordLoginFailure,
} from "@/lib/auth/rate-limit";

// Hash palsu: dipakai agar waktu respons sama baik email ada maupun tidak,
// sehingga penyerang tidak bisa menebak email mana yang terdaftar.
const DUMMY_HASH = hashSync(randomUUID(), 12);

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(raw, request) {
        const parsed = loginSchema.safeParse(raw);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;
        const keys = buildLoginKeys(email, getClientIp(request.headers));

        if (await isLoginBlocked(keys)) return null;

        const user = await prisma.user.findUnique({ where: { email } });
        const passwordOk = await compare(
          password,
          user?.passwordHash ?? DUMMY_HASH
        );

        if (!user || !passwordOk || !user.isActive) {
          await recordLoginFailure(keys);
          return null;
        }

        await clearEmailFailures(keys);
        await prisma.$transaction([
          prisma.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() },
          }),
          prisma.activityLog.create({
            data: {
              adminId: user.id,
              action: "auth.login",
              entityType: "User",
              entityId: user.id,
            },
          }),
        ]);

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        };
      },
    }),
  ],
});