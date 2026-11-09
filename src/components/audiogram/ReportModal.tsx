
'use client';

import { useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Printer, X } from 'lucide-react';
import { AudiogramTestData } from '@/types/audiogram';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportText: string | null;
  patientName: string;
  patientAge: string;
  testDate: string;
  testData: AudiogramTestData | null;
}

export function ReportModal({
  isOpen,
  onClose,
  reportText,
  patientName,
  patientAge,
  testDate,
  testData,
}: ReportModalProps) {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="fa" dir="rtl">
        <head>
          <meta charset="UTF-8" />
          <title>گزارش شنوایی - ${patientName}</title>

          <style>
          @font-face {
            font-family: 'Vazirmatn';
            src: url('https://cdn.jsdelivr.net/gh/rastikerdar/vazirmatn@v33.003/fonts/webfonts/Vazirmatn[wght].woff2') format('woff2 supports variations'),
                 url('https://cdn.jsdelivr.net/gh/rastikerdar/vazirmatn@v33.003/fonts/webfonts/Vazirmatn[wght].woff2') format('woff2-variations');
            font-weight: 100 900;
            font-style: normal;
            font-display: swap;
          }
            @page {
              size: A4 portrait;
              margin: 5mm;
            }

            * {
              box-sizing: border-box;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }

            html, body {
              margin: 0;
              padding: 0;
              font-family: 'Vazirmatn', Tahoma, Arial, sans-serif;
              font-size: 8pt;
              line-height: 1.3;
              color: #1e293b;
              direction: rtl;
            }

            body {
              width: 100%;
            }

            .print-container {
              width: 100%;
              margin: 0 auto;
            }

            /* هدر فشرده */
            .print-header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              border-bottom: 1px solid #94a3b8;
              padding-bottom: 4px;
              margin-bottom: 6px;
            }

            .print-header h1 {
              font-size: 12pt;
              font-weight:bold;
              margin: 0;
            }

            .print-header p {
              margin: 0;
              font-size: 8pt;
            }

            /* اطلاعات بیمار */
            .patient-info {
              display: flex;
              gap: 25px;
              padding: 4px 8px;
              margin-bottom: 6px;
              background: #f1f5f9;
              border-radius: 3px;
            }

            .patient-info p {
              margin: 0;
            }

            /* بخش‌ها */
            .section {
              margin-bottom: 7px;
              page-break-inside: avoid;
              break-inside: avoid;
            }

            .section h2 {
              font-size: 9pt;
              margin: 0 0 4px;
              padding-bottom: 2px;
              border-bottom: 1px solid #cbd5e1;
              color: #0f172a;
            }

            /* جدول‌ها */
            table {
              width: 100%;
              border-collapse: collapse;
              table-layout: fixed;
              margin: 0;
              font-size: 8pt;
            }

            th, td {
              border: 1px solid #cbd5e1;
              padding: 3px 5px;
              text-align: center;
              vertical-align: middle;
            }

            th {
              background: #f1f5f9 !important;
              font-weight: bold;
            }

            /* تفسیر */
            .prose {
              max-width: none !important;
              font-size: 8pt !important;
              line-height: 1.35 !important;
              background: #f8fafc;
              padding: 5px 8px;
              border-radius: 3px;
            }

            .prose h1,
            .prose h2,
            .prose h3,
            .prose h4 {
              font-size: 9pt !important;
              margin: 4px 0 2px !important;
            }

            .prose p {
              margin: 2px 0 !important;
            }

            .prose ul,
            .prose ol {
              margin: 2px 0 !important;
              padding-right: 18px;
            }

            .prose li {
              margin: 1px 0 !important;
            }

            .prose table {
              font-size: 7pt;
            }

            .prose th,
            .prose td {
              padding: 2px 3px;
            }

            /* یادداشت‌ها */
            .clinical-notes {
              padding: 5px 8px;
              background: #f8fafc;
              border-radius: 3px;
              margin: 0;
            }

            /* فوتر */
            .print-footer {
              border-top: 1px solid #cbd5e1;
              margin-top: 6px;
              padding-top: 3px;
              text-align: center;
              font-size: 7pt;
              color: #64748b;
            }

            p {
              orphans: 2;
              widows: 2;
            }

            @media print {
              html, body {
                width: 100%;
                height: auto;
              }

              .print-container {
                page-break-after: avoid;
              }

              .section,
              table,
              tr {
                page-break-inside: avoid;
                break-inside: avoid;
              }
            }
          </style>
        </head>

        <body>
          <div class="print-container">

            <div class="print-header">
              <h1>گزارش ارزیابی شنوایی</h1>
              <p>
                <strong>بیمار:</strong> ${patientName}
                &nbsp;&nbsp; | &nbsp;&nbsp;
                <p><strong>سن:</strong> ${patientAge} سال</p>
                &nbsp;&nbsp; | &nbsp;&nbsp;
                <strong>تاریخ تست:</strong> ${testDate}
              </p>
            </div>

            ${printContent.innerHTML}

            <div class="print-footer">
              این گزارش توسط سیستم AudioReport AI تولید شده است.
            </div>

          </div>
        </body>
      </html>
    `);

    printWindow.document.close();

    printWindow.onload = () => {
      printWindow.focus();

      setTimeout(() => {
        printWindow.print();
      }, 300);
    };

    printWindow.onafterprint = () => {
      printWindow.close();
    };
  };

  if (!testData) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="max-w-4xl max-h-[90vh] overflow-y-auto"
        dir="rtl"
      >
        <DialogHeader>
          <DialogTitle>گزارش بالینی</DialogTitle>
          <DialogDescription>
            بیمار: {patientName} | تاریخ: {testDate}
          </DialogDescription>
        </DialogHeader>

        <div className="flex justify-end gap-2 mb-3">
          <Button variant="outline" onClick={onClose}>
            <X className="w-4 h-4 ml-2" />
            بستن
          </Button>

          <Button onClick={handlePrint}>
            <Printer className="w-4 h-4 ml-2" />
            چاپ / ذخیره PDF
          </Button>
        </div>

        <div
          ref={printRef}
          className="space-y-3 text-sm"
        >

          {/* نتایج اودیوگرام */}
          <div className="section">
            <h2 className="text-lg font-bold mb-2">
              نتایج اودیوگرام
            </h2>

            <table className="w-full border-collapse border border-slate-300">
              <thead>
                <tr className="bg-slate-100">
                  <th className="border p-2">فرکانس (Hz)</th>
                  <th className="border p-2 text-red-500">هوای راست (dB)</th>
                  <th className="border p-2 text-red-500">استخوان راست (dB)</th>
                  <th className="border p-2 text-blue-500">هوای چپ (dB)</th>
                  <th className="border p-2 text-blue-500">استخوان چپ (dB)</th>
                </tr>
              </thead>

              <tbody>
                {[250, 500, 1000, 2000, 4000, 8000].map((freq) => (
                  <tr key={freq}>
                    <td className="border p-2 text-center font-medium">
                      {freq}
                    </td>
                    <td className="border p-2 text-center">
                      {testData.audiogram.right_ear[freq]?.air.db ?? '-'}
                    </td>
                    <td className="border p-2 text-center">
                      {testData.audiogram.right_ear[freq]?.bone.db ?? '-'}
                    </td>
                    <td className="border p-2 text-center">
                      {testData.audiogram.left_ear[freq]?.air.db ?? '-'}
                    </td>
                    <td className="border p-2 text-center">
                      {testData.audiogram.left_ear[freq]?.bone.db ?? '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* گفتار و تیمپانومتری */}
          <div className="section">
            <h2 className="text-lg font-bold mb-2">
              گفتار و تیمپانومتری
            </h2>

            <table className="w-full border-collapse border border-slate-300">
              <thead>
                <tr className="bg-slate-100">
                  <th className="border p-2">شاخص</th>
                  <th className="border p-2 text-red-500">گوش راست</th>
                  <th className="border p-2 text-blue-500">گوش چپ</th>
                </tr>
              </thead>

              <tbody>
                <tr>
                  <td className="border p-2 font-medium">SRT (dB)</td>
                  <td className="border p-2 text-center">
                    {testData.speech_audiometry.srt_right ?? '-'}
                  </td>
                  <td className="border p-2 text-center">
                    {testData.speech_audiometry.srt_left ?? '-'}
                  </td>
                </tr>

                <tr>
                  <td className="border p-2 font-medium">WRS (%)</td>
                  <td className="border p-2 text-center">
                    {testData.speech_audiometry.wrs_right ?? '-'}
                  </td>
                  <td className="border p-2 text-center">
                    {testData.speech_audiometry.wrs_left ?? '-'}
                  </td>
                </tr>

                <tr>
                  <td className="border p-2 font-medium">تیمپانومتری</td>
                  <td className="border p-2 text-center">
                    {testData.tympanometry.type_right ?? '-'}
                  </td>
                  <td className="border p-2 text-center">
                    {testData.tympanometry.type_left ?? '-'}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* تفسیر AI */}
          {reportText && (
            <div className="section">
              <h2 className="text-lg font-bold mb-2">
                تفسیر بالینی
              </h2>

              <div className="prose prose-sm max-w-none bg-slate-50 p-3 rounded-lg">
                <ReactMarkdown>{reportText}</ReactMarkdown>
              </div>
            </div>
          )}

          {/* یادداشت‌های بالینی */}
          {testData.clinical_notes && (
            <div className="section">
              <h2 className="text-lg font-bold mb-2">
                یادداشت‌های بالینی
              </h2>

              <p className="clinical-notes bg-slate-50 p-3 rounded-lg">
                {testData.clinical_notes}
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
