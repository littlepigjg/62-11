import { useRef, useCallback } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import dayjs from 'dayjs';
import { message } from 'antd';

export const usePDFExport = () => {
  const dashboardRef = useRef<HTMLDivElement>(null);

  const exportToPDF = useCallback(async (title: string = '仪表盘报告') => {
    if (!dashboardRef.current) {
      message.error('无法找到仪表盘容器');
      return;
    }

    const hide = message.loading('正在生成 PDF 报告...', 0);

    try {
      const element = dashboardRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: document.body.classList.contains('theme-dark') || document.body.classList.contains('theme-screen')
          ? '#0a0a0a'
          : '#ffffff',
      });

      const imgData = canvas.toDataURL('image/png');
      const pdfWidth = canvas.width / 2;
      const pdfHeight = canvas.height / 2;

      const pdf = new jsPDF({
        orientation: pdfWidth > pdfHeight ? 'landscape' : 'portrait',
        unit: 'px',
        format: [pdfWidth + 40, pdfHeight + 60],
      });

      pdf.setFontSize(16);
      pdf.text(title, 20, 25);
      pdf.setFontSize(10);
      pdf.setTextColor(128);
      pdf.text(`生成时间: ${dayjs().format('YYYY-MM-DD HH:mm:ss')}`, 20, 40);

      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 20, 50, imgWidth, imgHeight);

      const filename = `仪表盘报告_${dayjs().format('YYYYMMDD_HHmmss')}.pdf`;
      pdf.save(filename);
      hide();
      message.success(`PDF 报告已导出: ${filename}`);
    } catch (err) {
      hide();
      console.error('PDF export error:', err);
      message.error('导出 PDF 失败，请重试');
    }
  }, []);

  return { dashboardRef, exportToPDF };
};
