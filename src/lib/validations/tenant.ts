// lib/validations/tenant.ts
import { z } from "zod";

export const tenantSchema = z.object({
  name: z.string().min(2, "نام مطب باید حداقل 2 کاراکتر باشد"),
  slug: z.string()
    .min(2, "اسلاگ باید حداقل 2 کاراکتر باشد")
    .regex(/^[a-z0-9-]+$/, "اسلاگ فقط می‌تواند شامل حروف کوچک، اعداد و خط تیره باشد"),
  email: z.string().email("ایمیل نامعتبر است").optional().nullable(),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  province: z.string().optional().nullable(),
  postal_code: z.string().optional().nullable(),
  license_key: z.string().optional().nullable(),
  plan: z.enum(["free", "basic", "premium", "enterprise"]).default("free"),
  status: z.enum(["active", "inactive", "suspended"]).default("active"),
  expires_at: z.string().optional().nullable(),
  max_users: z.number().min(1, "حداقل کاربران باید 1 باشد").default(5),
  max_patients: z.number().min(1, "حداقل بیماران باید 1 باشد").default(100),
});

export type TenantFormData = z.infer<typeof tenantSchema>;