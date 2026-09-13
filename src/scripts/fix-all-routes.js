// scripts/fix-all-routes.js
const fs = require('fs');
const path = require('path');
const glob = require('glob');

const template = `import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id?: string }> }
) {
  return NextResponse.json(
    { error: 'این API هنوز پیاده‌سازی نشده است' },
    { status: 501 }
  );
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id?: string }> }
) {
  return NextResponse.json(
    { error: 'این API هنوز پیاده‌سازی نشده است' },
    { status: 501 }
  );
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id?: string }> }
) {
  return NextResponse.json(
    { error: 'این API هنوز پیاده‌سازی نشده است' },
    { status: 501 }
  );
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id?: string }> }
) {
  return NextResponse.json(
    { error: 'این API هنوز پیاده‌سازی نشده است' },
    { status: 501 }
  );
}
`;

// پیدا کردن همه مسیرهای API که فایل route.ts ندارند
const apiDirs = glob.sync('src/app/api/**/', { nodir: false });

apiDirs.forEach(dir => {
  const routeFile = path.join(dir, 'route.ts');
  
  if (!fs.existsSync(routeFile)) {
    console.log(`📝 Creating: ${routeFile}`);
    fs.writeFileSync(routeFile, template);
  }
});

console.log('✅ همه فایل‌های route.ts ایجاد شدند!');