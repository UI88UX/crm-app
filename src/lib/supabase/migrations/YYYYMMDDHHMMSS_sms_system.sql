-- ============================================
-- SMS SYSTEM - PHASE 1 MIGRATION
-- ============================================

-- ============================================
-- 1. SMS Templates (قالب‌های پیامک)
-- ============================================
CREATE TABLE IF NOT EXISTS sms_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN (
    'appointment_confirmation',
    'appointment_reminder_24h',
    'appointment_reminder_2h',
    'appointment_cancelled',
    'appointment_no_show',
    'hearing_aid_purchased',
    'hearing_aid_day_3',
    'hearing_aid_day_14',
    'hearing_aid_day_30',
    'hearing_aid_month_3',
    'hearing_aid_month_6',
    'hearing_aid_month_12',
    'hearing_aid_month_18_24',
    'birthday',
    'bulk_campaign'
  )),
  content TEXT NOT NULL,
  variables JSONB DEFAULT '[]'::JSONB, -- ["patient.first_name", "appointment.date", ...]
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(tenant_id, type)
);

-- ============================================
-- 2. SMS Queue (صف ارسال پیامک‌ها)
-- ============================================
CREATE TABLE IF NOT EXISTS sms_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- اطلاعات گیرنده
  patient_id UUID REFERENCES patients(id) ON DELETE SET NULL,
  phone TEXT NOT NULL,
  
  -- محتوای پیام
  template_id UUID REFERENCES sms_templates(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  variables JSONB DEFAULT '{}'::JSONB,
  
  -- زمان‌بندی
  scheduled_at TIMESTAMPTZ NOT NULL, -- زمان ارسال برنامه‌ریزی‌شده
  priority INTEGER DEFAULT 0, -- 0=عادی، 1=بالا، 2=فوری
  
  -- وضعیت
  status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending',    -- در صف انتظار
    'sent',       -- ارسال شده
    'delivered',  -- تحویل داده شده
    'failed',     -- ناموفق
    'cancelled'   -- لغو شده
  )),
  
  -- اطلاعات ارسال
  provider TEXT, -- kavenegar / melipayamak
  provider_message_id TEXT, -- شناسه پیام در Provider
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  last_error TEXT,
  
  -- متادیتا
  type TEXT NOT NULL CHECK (type IN (
    'appointment_confirmation',
    'appointment_reminder',
    'appointment_cancelled',
    'appointment_no_show',
    'hearing_aid_followup',
    'birthday',
    'bulk_campaign'
  )),
  reference_id UUID, -- ارجاع به Appointment/Patient/... 
  reference_type TEXT, -- appointments / patients / sales
  
  -- زمان‌های ثبت
  created_at TIMESTAMPTZ DEFAULT now(),
  sent_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- ایندکس‌ها
  INDEX idx_sms_queue_scheduled_at (scheduled_at, status),
  INDEX idx_sms_queue_tenant (tenant_id, status),
  INDEX idx_sms_queue_patient (patient_id)
);

-- ============================================
-- 3. SMS Logs (لاگ کامل)
-- ============================================
CREATE TABLE IF NOT EXISTS sms_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- ارتباط با سایر جداول
  queue_id UUID REFERENCES sms_queue(id) ON DELETE SET NULL,
  patient_id UUID REFERENCES patients(id) ON DELETE SET NULL,
  campaign_id UUID REFERENCES sms_campaigns(id) ON DELETE SET NULL,
  
  -- اطلاعات پیام
  phone TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL,
  provider TEXT NOT NULL,
  
  -- وضعیت ارسال
  status TEXT NOT NULL CHECK (status IN ('sent', 'delivered', 'failed')),
  error TEXT,
  provider_response JSONB,
  
  -- هزینه
  cost DECIMAL(10,2) DEFAULT 0,
  
  -- زمان‌ها
  sent_at TIMESTAMPTZ DEFAULT now(),
  
  -- ایندکس‌ها
  INDEX idx_sms_logs_tenant (tenant_id),
  INDEX idx_sms_logs_patient (patient_id),
  INDEX idx_sms_logs_sent_at (sent_at)
);

-- ============================================
-- 4. SMS Campaigns (کمپین‌های گروهی - فاز 2)
-- ============================================
CREATE TABLE IF NOT EXISTS sms_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- اطلاعات کمپین
  name TEXT NOT NULL,
  template_id UUID REFERENCES sms_templates(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  variables JSONB DEFAULT '{}'::JSONB,
  
  -- فیلترها (ذخیره به‌صورت JSON)
  filters JSONB DEFAULT '{}'::JSONB,
  
  -- آمار
  total_recipients INTEGER DEFAULT 0,
  sent_count INTEGER DEFAULT 0,
  delivered_count INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0,
  
  -- وضعیت
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sending', 'sent', 'failed', 'cancelled')),
  scheduled_at TIMESTAMPTZ,
  
  -- اطلاعات ارسال‌کننده
  created_by UUID REFERENCES users(id),
  
  -- زمان‌ها
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- ایندکس‌ها
  INDEX idx_sms_campaigns_tenant (tenant_id, status),
  INDEX idx_sms_campaigns_scheduled_at (scheduled_at)
);

-- ============================================
-- 5. SMS Settings (تنظیمات هر Tenant)
-- ============================================
CREATE TABLE IF NOT EXISTS sms_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE UNIQUE,
  
  -- تنظیمات عمومی
  is_enabled BOOLEAN DEFAULT true,
  provider TEXT DEFAULT 'kavenegar' CHECK (provider IN ('kavenegar', 'melipayamak')),
  
  -- زمان‌بندی یادآوری‌ها
  reminder_hours_1 INTEGER DEFAULT 24, -- یادآوری اول (ساعت قبل)
  reminder_hours_2 INTEGER DEFAULT 2,  -- یادآوری دوم (ساعت قبل)
  
  -- سیاست ارسال
  max_messages_per_month INTEGER DEFAULT 10, -- سقف پیام در ماه برای هر بیمار
  allowed_start_hour INTEGER DEFAULT 9,     -- ساعت شروع ارسال
  allowed_end_hour INTEGER DEFAULT 20,      -- ساعت پایان ارسال
  allow_holidays BOOLEAN DEFAULT false,     -- ارسال در تعطیلات
  
  -- تنظیمات فازهای بعدی
  enable_birthday_alerts BOOLEAN DEFAULT true,
  enable_hearing_aid_followup BOOLEAN DEFAULT true,
  
  -- تنظیمات پیامک‌ها
  clinic_name TEXT, -- نام مطب (برای متن پیامک)
  
  -- زمان‌ها
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- 6. به‌روزرسانی جدول Patients (برای فیلدهای جدید)
-- ============================================
ALTER TABLE patients ADD COLUMN IF NOT EXISTS hearing_aid_brand TEXT;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS hearing_aid_purchased_at TIMESTAMPTZ;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS hearing_aid_model TEXT;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS last_service_date TIMESTAMPTZ;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS next_service_date TIMESTAMPTZ;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS battery_usage_days INTEGER; -- میانگین مصرف باتری
ALTER TABLE patients ADD COLUMN IF NOT EXISTS consent_to_sms BOOLEAN DEFAULT true; -- رضایت دریافت پیامک
ALTER TABLE patients ADD COLUMN IF NOT EXISTS last_sms_sent_at TIMESTAMPTZ; -- آخرین پیامک ارسال‌شده
ALTER TABLE patients ADD COLUMN IF NOT EXISTS sms_count_this_month INTEGER DEFAULT 0; -- تعداد پیامک‌های این ماه

-- ============================================
-- 7. به‌روزرسانی جدول Appointments (برای وضعیت‌های جدید)
-- ============================================
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS no_show_followup_sent BOOLEAN DEFAULT false;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS reminder_24h_sent BOOLEAN DEFAULT false;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS reminder_2h_sent BOOLEAN DEFAULT false;

-- ============================================
-- 8. توابع کمکی (Functions)
-- ============================================

-- تابع برای افزایش تعداد پیامک‌های ماهانه بیمار
CREATE OR REPLACE FUNCTION increment_sms_count()
RETURNS TRIGGER AS $$
BEGIN
  -- در ابتدای هر ماه، شمارنده را ریست کن
  IF DATE_TRUNC('month', NEW.sent_at) > DATE_TRUNC('month', OLD.sent_at) THEN
    NEW.sms_count_this_month = 0;
  END IF;
  NEW.sms_count_this_month = NEW.sms_count_this_month + 1;
  NEW.last_sms_sent_at = NEW.sent_at;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- تریگر برای بروزرسانی شمارنده
CREATE TRIGGER update_sms_count
BEFORE UPDATE ON patients
FOR EACH ROW
EXECUTE FUNCTION increment_sms_count();

-- تابع برای بررسی سقف ارسال
CREATE OR REPLACE FUNCTION can_send_sms(patient_id UUID, tenant_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  patient_sms_count INTEGER;
  max_allowed INTEGER;
  current_month DATE;
BEGIN
  current_month = DATE_TRUNC('month', NOW());
  
  SELECT sms_count_this_month INTO patient_sms_count
  FROM patients
  WHERE id = patient_id;
  
  SELECT max_messages_per_month INTO max_allowed
  FROM sms_settings
  WHERE tenant_id = $2;
  
  IF max_allowed IS NULL THEN
    max_allowed = 10; -- مقدار پیش‌فرض
  END IF;
  
  RETURN COALESCE(patient_sms_count, 0) < max_allowed;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 9. درج قالب‌های پیش‌فرض
-- ============================================

-- تابع برای درج قالب‌های پیش‌فرض برای هر Tenant جدید
CREATE OR REPLACE FUNCTION insert_default_sms_templates()
RETURNS TRIGGER AS $$
BEGIN
  -- قالب تأیید نوبت
  INSERT INTO sms_templates (tenant_id, type, name, content, variables)
  VALUES (
    NEW.id,
    'appointment_confirmation',
    'تأیید نوبت',
    'سلام {{patient.first_name}} عزیز،\nنوبت شما برای {{appointment.date}} ساعت {{appointment.time}} در {{clinic.name}} ثبت شد.\nلطفاً ۱۵ دقیقه زودتر حاضر باشید.\nشماره تماس: {{clinic.phone}}',
    '["patient.first_name", "appointment.date", "appointment.time", "clinic.name", "clinic.phone"]'
  );
  
  -- قالب یادآوری ۲۴ ساعت قبل
  INSERT INTO sms_templates (tenant_id, type, name, content, variables)
  VALUES (
    NEW.id,
    'appointment_reminder_24h',
    'یادآوری ۲۴ ساعت قبل',
    'سلام {{patient.first_name}} عزیز،\nفردا ساعت {{appointment.time}} نوبت شنوایی‌سنجی دارید.\nلطفاً ۱۵ دقیقه زودتر حاضر باشید.',
    '["patient.first_name", "appointment.time"]'
  );
  
  -- قالب یادآوری ۲ ساعت قبل
  INSERT INTO sms_templates (tenant_id, type, name, content, variables)
  VALUES (
    NEW.id,
    'appointment_reminder_2h',
    'یادآوری ۲ ساعت قبل',
    'سلام {{patient.first_name}} عزیز،\nامروز ساعت {{appointment.time}} نوبت شنوایی‌سنجی دارید.\nمنتظر شما هستیم.',
    '["patient.first_name", "appointment.time"]'
  );
  
  -- قالب خرید سمعک
  INSERT INTO sms_templates (tenant_id, type, name, content, variables)
  VALUES (
    NEW.id,
    'hearing_aid_purchased',
    'خرید سمعک - تشکر',
    'سلام {{patient.first_name}} عزیز،\nاز خرید سمعک {{hearing_aid.brand}} از مطب ما سپاسگزاریم.\nراهنمای استفاده از سمعک برای شما ارسال شد.\nدر صورت نیاز به راهنمایی بیشتر با ما تماس بگیرید.',
    '["patient.first_name", "hearing_aid.brand"]'
  );
  
  -- قالب تولد
  INSERT INTO sms_templates (tenant_id, type, name, content, variables)
  VALUES (
    NEW.id,
    'birthday',
    'تبریک تولد',
    'سلام {{patient.first_name}} عزیز،\nتولدتان مبارک! برای شما سالی پر از سلامتی و شادی آرزومندیم.\n{{clinic.name}}',
    '["patient.first_name", "clinic.name"]'
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- تریگر برای درج قالب‌های پیش‌فرض هنگام ایجاد Tenant جدید
CREATE TRIGGER create_default_sms_templates
AFTER INSERT ON tenants
FOR EACH ROW
EXECUTE FUNCTION insert_default_sms_templates();

-- ============================================
-- 10. درج تنظیمات پیش‌فرض برای Tenantهای موجود
-- ============================================
INSERT INTO sms_settings (tenant_id, clinic_name)
SELECT id, name FROM tenants
ON CONFLICT (tenant_id) DO NOTHING;

-- درج قالب‌های پیش‌فرض برای Tenantهای موجود
INSERT INTO sms_templates (tenant_id, type, name, content, variables)
SELECT 
  t.id,
  'appointment_confirmation',
  'تأیید نوبت',
  'سلام {{patient.first_name}} عزیز،\nنوبت شما برای {{appointment.date}} ساعت {{appointment.time}} در {{clinic.name}} ثبت شد.\nلطفاً ۱۵ دقیقه زودتر حاضر باشید.\nشماره تماس: {{clinic.phone}}',
  '["patient.first_name", "appointment.date", "appointment.time", "clinic.name", "clinic.phone"]'
FROM tenants t
WHERE NOT EXISTS (
  SELECT 1 FROM sms_templates st 
  WHERE st.tenant_id = t.id AND st.type = 'appointment_confirmation'
);

-- ============================================
-- 11. ایندکس‌های نهایی برای بهینه‌سازی
-- ============================================
CREATE INDEX idx_sms_queue_pending_tenant ON sms_queue (status, tenant_id, scheduled_at);
CREATE INDEX idx_sms_logs_type ON sms_logs (type, sent_at);
CREATE INDEX idx_sms_campaigns_status ON sms_campaigns (status, scheduled_at);