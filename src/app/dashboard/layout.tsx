import { Sidebar } from "@/app/dashboard/sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 mr-64 min-h-screen overflow-auto p-6">
        {children}
      </main>
    </div>
  );
}