import { requireAdmin } from "@/lib/auth/session";
import { AdminFrame } from "@/components/admin/admin-frame";

export async function AdminShell({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();

  return (
    <AdminFrame adminName={admin.name} adminEmail={admin.email}>
      {children}
    </AdminFrame>
  );
}