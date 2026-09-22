// src/app/admin/login/page.tsx
import { Suspense } from 'react';
import AdminLoginForm from './login-form';

export default function AdminLoginPage() {
  return (
    <Suspense      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500" />
        </div>
      }
    >
      <AdminLoginForm />
    </Suspense>
  );
}