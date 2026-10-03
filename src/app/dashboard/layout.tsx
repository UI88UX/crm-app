import { Sidebar } from "@/app/dashboard/sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar />
      <main className="flex-1 md:mr-64 h-screen overflow-y-auto p-4 md:p-6 pt-16 lg:pt-6">
        {children}
      </main>
    </div>
  );
}