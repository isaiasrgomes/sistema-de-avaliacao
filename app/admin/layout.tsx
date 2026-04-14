import { AdminSidebar } from "@/components/admin-sidebar";
import { BackNav } from "@/components/back-nav";

export const dynamic = "force-dynamic";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-transparent">
      <AdminSidebar />
      <div className="flex-1 overflow-auto">
        <div className="min-h-screen bg-gradient-to-b from-transparent via-background/80 to-background/95 px-4 py-5 sm:px-6 lg:px-8">
          <BackNav sectionRoot="/admin" primaryLabel="Monitoramento" />
          {children}
        </div>
      </div>
    </div>
  );
}
