import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

interface ReportData {
  patientName: string;
  patientId: string;
  date: string;
  summary: any;
  insights: any[];
  correlations: any[];
}

export const generateAndShareReport = async (data: ReportData) => {
  try {
    // Basic styling for the PDF
    const html = `
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
          <style>
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 40px; color: #333; direction: rtl; text-align: right; }
            .header { text-align: center; margin-bottom: 40px; border-bottom: 2px solid #2563EB; padding-bottom: 20px; }
            .logo { font-size: 28px; font-weight: bold; color: #2563EB; margin-bottom: 10px; }
            h1 { color: #1E293B; font-size: 24px; }
            h2 { color: #3B82F6; font-size: 20px; margin-top: 30px; border-bottom: 1px solid #E2E8F0; padding-bottom: 5px; }
            .info-box { background: #F8FAFC; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
            .info-box p { margin: 5px 0; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; }
            th, td { border: 1px solid #E2E8F0; padding: 10px; text-align: right; }
            th { background: #F1F5F9; color: #475569; }
            .alert-critical { color: #DC2626; font-weight: bold; }
            .insight-box { border-right: 4px solid #3B82F6; padding-right: 15px; margin: 15px 0; background: #EFF6FF; padding: 15px; border-radius: 4px; }
            .footer { margin-top: 50px; text-align: center; color: #94A3B8; font-size: 12px; border-top: 1px solid #E2E8F0; padding-top: 20px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo">Life Care ⚕️</div>
            <h1>التقرير الطبي الشامل</h1>
          </div>

          <div class="info-box">
            <p><strong>اسم المريض:</strong> ${data.patientName}</p>
            <p><strong>رقم الملف:</strong> ${data.patientId}</p>
            <p><strong>تاريخ التقرير:</strong> ${data.date}</p>
          </div>

          <h2>1. ملخص الأحداث الحرجة</h2>
          <table>
            <tr>
              <th>إجمالي التنبيهات</th>
              <th>أعلى نبض</th>
              <th>أقل نبض</th>
            </tr>
            <tr>
              <td>${data.summary.totalAlerts}</td>
              <td>${data.summary.highestHR || 'غير متوفر'}</td>
              <td>${data.summary.lowestHR || 'غير متوفر'}</td>
            </tr>
          </table>

          <h2>2. الفترات الزمنية غير الطبيعية (Duration Analysis)</h2>
          <table>
            <tr>
              <th>المؤشر</th>
              <th>وقت البداية</th>
              <th>وقت النهاية</th>
              <th>المدة (ثواني)</th>
              <th>الوصف</th>
            </tr>
            ${data.summary.abnormalPeriods.length > 0 ? data.summary.abnormalPeriods.map((p: any) => `
              <tr>
                <td>${p.sensor}</td>
                <td dir="ltr">${new Date(p.startTime).toLocaleTimeString()}</td>
                <td dir="ltr">${new Date(p.endTime).toLocaleTimeString()}</td>
                <td>${p.duration}</td>
                <td class="alert-critical">${p.description}</td>
              </tr>
            `).join('') : '<tr><td colspan="5" style="text-align: center">لا توجد أحداث غير طبيعية</td></tr>'}
          </table>

          <h2>3. ارتباط الملاحظات بالقراءات (Note Correlation)</h2>
          ${data.correlations.length > 0 ? data.correlations.map((c: any) => `
            <div class="info-box" style="background: #FEF2F2; border-right: 4px solid #EF4444;">
              <p><strong>ملاحظة المريض:</strong> "${c.note}"</p>
              <p><strong>الوقت:</strong> <span dir="ltr">${new Date(c.noteTime).toLocaleTimeString()}</span></p>
              <p style="margin-top: 10px;"><strong>الحدث المرتبط:</strong></p>
              <ul>
                ${c.relatedAlerts.map((a: any) => `<li>${a.type}: ${a.description} (عند ${new Date(a.time).toLocaleTimeString()})</li>`).join('')}
              </ul>
            </div>
          `).join('') : '<p>لم يتم رصد ارتباطات مباشرة بين الملاحظات والتنبيهات الحيوية.</p>'}

          <h2>4. التحليلات والرؤى الذكية (AI Insights)</h2>
          ${data.insights.length > 0 ? data.insights.map((i: any) => `
            <div class="insight-box">
              <h4 style="margin: 0 0 5px 0; color: #1E40AF;">${i.title}</h4>
              <p style="margin: 0;">${i.description}</p>
            </div>
          `).join('') : '<p>لا توجد أنماط متكررة تستدعي إشعارات ذكية حالياً.</p>'}

          <div class="footer">
            تم استخراج هذا التقرير آلياً بواسطة نظام Life Care للرعاية الصحية.
            <br />
            صفحة 1 من 1
          </div>
        </body>
      </html>
    `;

    // Print to PDF
    const { uri } = await Print.printToFileAsync({ html });
    
    // Share / Save the PDF
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
    }
    
    return uri;
  } catch (error) {
    console.error('Error generating PDF', error);
    throw error;
  }
};
