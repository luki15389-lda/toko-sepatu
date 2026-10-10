export type ActionResult =
  | { ok: true; message: string }
  | {
      ok: false;
      message: string;
      fieldErrors?: Partial<Record<string, string>>;
    };

export function fail(
  message: string,
  fieldErrors?: Partial<Record<string, string>>
): ActionResult {
  return { ok: false, message, fieldErrors };
}

export function succeed(message: string): ActionResult {
  return { ok: true, message };
}