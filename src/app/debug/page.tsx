// app/debug/page.tsx
import { createClient } from "@/lib/supabase/server";

export default async function DebugPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return <div>کاربر لاگین نیست</div>;
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">اطلاعات کاربر</h1>
      <pre className="bg-gray-100 p-4 rounded-lg overflow-auto">
        {JSON.stringify({
          id: user.id,
          email: user.email,
          app_metadata: user.app_metadata,
          user_metadata: user.user_metadata,
          role: user.role,
        }, null, 2)}
      </pre>
    </div>
  );
}