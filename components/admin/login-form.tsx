"use client";

import { useActionState, useState } from "react";
import { Eye, EyeOff, LoaderCircle } from "lucide-react";
import { loginAction, type LoginState } from "@/lib/actions/auth";

const initialState: LoginState = {};

export function LoginForm() {
  const [state, formAction, pending] = useActionState(
    loginAction,
    initialState
  );
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form action={formAction} className="space-y-5" noValidate>
      {state.error && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {state.error}
        </div>
      )}

      <div className="space-y-1.5">
        <label htmlFor="email" className="text-sm font-medium">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          required
          defaultValue={state.email}
          aria-invalid={!!state.fieldErrors?.email}
          aria-describedby={state.fieldErrors?.email ? "email-error" : undefined}
          className="h-11 w-full rounded-lg border border-stone-300 bg-white px-3.5 text-sm outline-none transition focus:border-ink focus:ring-2 focus:ring-ink/10"
        />
        {state.fieldErrors?.email && (
          <p id="email-error" className="text-xs text-red-600">
            {state.fieldErrors.email}
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <label htmlFor="password" className="text-sm font-medium">
          Password
        </label>
        <div className="relative">
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            required
            aria-invalid={!!state.fieldErrors?.password}
            aria-describedby={
              state.fieldErrors?.password ? "password-error" : undefined
            }
            className="h-11 w-full rounded-lg border border-stone-300 bg-white px-3.5 pr-11 text-sm outline-none transition focus:border-ink focus:ring-2 focus:ring-ink/10"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
            className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-stone-500 hover:text-ink"
          >
            {showPassword ? (
              <EyeOff className="size-4" aria-hidden />
            ) : (
              <Eye className="size-4" aria-hidden />
            )}
          </button>
        </div>
        {state.fieldErrors?.password && (
          <p id="password-error" className="text-xs text-red-600">
            {state.fieldErrors.password}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={pending}
        className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-ink text-sm font-semibold text-paper transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {pending && <LoaderCircle className="size-4 animate-spin" aria-hidden />}
        {pending ? "Memeriksa..." : "Masuk"}
      </button>
    </form>
  );
}