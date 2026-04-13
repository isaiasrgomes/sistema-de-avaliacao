import { AdminSidebar } from "@/components/admin-sidebar";

export const dynamic = "force-dynamic";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <AdminSidebar />
      <div className="flex-1 overflow-auto bg-muted/20">{children}</div>
    </div>
  );
}
