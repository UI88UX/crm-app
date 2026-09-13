import { Sidebar } from "@/app/dashboard/sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 lg:mr-64 min-h-screen overflow-auto p-4 md:p-6 pt-20 lg:pt-6">
        {children}
      </main>
    </div>
  );
}