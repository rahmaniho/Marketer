import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

/**
 * تبدیل یک المان HTML (پیش‌فاکتور/فاکتور/گزارش) به فایل PDF
 * دلیل استفاده از html2canvas: فونت فارسی و RTL بدون نیاز به جاسازی فونت در jsPDF.
 */
export const elementToPdf = async (
  element: HTMLElement,
  filename: string,
  options: { orientation?: 'p' | 'l'; title?: string } = {},
) => {
  const canvas = await html2canvas(element, {
    scale: 2,
    backgroundColor: '#ffffff',
    useCORS: true,
    logging: false,
    windowWidth: element.scrollWidth,
  });
  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF({ orientation: options.orientation ?? 'p', unit: 'mm', format: 'a4' });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const imgWidth = pageWidth;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;
  let heightLeft = imgHeight;
  let position = 0;

  pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
  heightLeft -= pageHeight;
  while (heightLeft > 0) {
    position -= pageHeight;
    pdf.addPage();
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
  }
  if (options.title) pdf.setProperties({ title: options.title, creator: 'بازارعمده — کارن سافت' });
  pdf.save(filename);
};

/** چاپ مستقیم مرورگر (برای پیش‌فاکتور و فاکتور رسمی) */
export const printElement = (element: HTMLElement, title: string) => {
  const w = window.open('', '_blank', 'width=900,height=1200');
  if (!w) return;
  const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
    .map((s) => s.outerHTML)
    .join('');
  w.document.write(`<!doctype html><html lang="fa" dir="rtl"><head><meta charset="utf-8"><title>${title}</title>${styles}
    <style>body{background:#fff;padding:16px;font-family:Vazirmatn,Tahoma,sans-serif}</style></head>
    <body>${element.outerHTML}</body></html>`);
  w.document.close();
  setTimeout(() => {
    w.focus();
    w.print();
  }, 600);
};
