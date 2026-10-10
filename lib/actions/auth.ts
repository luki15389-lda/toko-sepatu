"use server";

import { headers } from "next/headers";
import { AuthError } from "next-auth";
import { signIn, signOut } from "@/auth";
import { loginSchema } from "@/lib/validations/auth";
import {
  buildLoginKeys,
  getClientIp,
  isLoginBlocked,
} from "@/lib/auth/rate-limit";

export type LoginState = {
  error?: string;
  fieldErrors?: { email?: string; password?: string };
  email?: string;
};

export async function loginAction(
  _prev: LoginState,
  formData: FormData
): Promise<LoginState> {
  const rawEmail = String(formData.get("email") ?? "");
  const parsed = loginSchema.safeParse({
    email: rawEmail,
    password: formData.get("password"),
  });

  if (!parsed.success) {
    const flat = parsed.error.flatten().fieldErrors;
    return {
      email: rawEmail,
      fieldErrors: {
        email: flat.email?.[0],
        password: flat.password?.[0],
      },
    };
  }

  const { email, password } = parsed.data;

  // Pesan khusus jika terlalu banyak percobaan gagal
  const keys = buildLoginKeys(email, getClientIp(await headers()));
  if (await isLoginBlocked(keys)) {
    return {
      email,
      error:
        "Terlalu banyak percobaan login. Coba lagi dalam 15 menit.",
    };
  }

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: "/admin/dashboard",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { email, error: "Email atau password salah." };
    }
    // Redirect sukses dilempar sebagai error khusus oleh Next.js: jangan ditelan.
    throw error;
  }

  return { email };
}

export async function logoutAction() {
  await signOut({ redirectTo: "/admin/login" });
}