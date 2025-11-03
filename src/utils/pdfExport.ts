import jsPDF from 'jspdf';

export interface JournalEntryData {
  title: string;
  content: string;
  date: string;
}

/**
 * Export journal entry as PDF
 */
export const exportJournalToPDF = (entry: JournalEntryData) => {
  const pdf = new jsPDF();
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 20;
  const maxLineWidth = pageWidth - (margin * 2);
  
  // Add title
  pdf.setFontSize(20);
  pdf.setFont('helvetica', 'bold');
  pdf.text(entry.title, margin, margin);
  
  // Add date
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'normal');
  const dateText = `Date: ${new Date(entry.date).toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })}`;
  pdf.text(dateText, margin, margin + 10);
  
  // Add horizontal line
  pdf.setLineWidth(0.5);
  pdf.line(margin, margin + 15, pageWidth - margin, margin + 15);
  
  // Add content
  pdf.setFontSize(11);
  const splitContent = pdf.splitTextToSize(entry.content, maxLineWidth);
  let yPosition = margin + 25;
  
  for (let i = 0; i < splitContent.length; i++) {
    if (yPosition > pageHeight - margin) {
      pdf.addPage();
      yPosition = margin;
    }
    pdf.text(splitContent[i], margin, yPosition);
    yPosition += 7;
  }
  
  // Add footer
  const footerText = 'SpiritConnect Journal Entry';
  pdf.setFontSize(9);
  pdf.setTextColor(128, 128, 128);
  pdf.text(footerText, pageWidth / 2, pageHeight - 10, { align: 'center' });
  
  // Save the PDF
  const fileName = `journal_${entry.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${new Date(entry.date).toISOString().split('T')[0]}.pdf`;
  pdf.save(fileName);
};

/**
 * Share journal entry text to social media or messaging apps
 */
export const shareJournalEntry = async (entry: JournalEntryData) => {
  const shareText = `${entry.title}\n\n${entry.content}\n\n— SpiritConnect Journal, ${new Date(entry.date).toLocaleDateString()}`;
  
  if (navigator.share) {
    // Use native share API if available (mobile)
    try {
      await navigator.share({
        title: entry.title,
        text: shareText,
      });
      return true;
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        console.error('Error sharing:', error);
      }
      return false;
    }
  } else {
    // Fallback: copy to clipboard
    try {
      await navigator.clipboard.writeText(shareText);
      return true;
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      return false;
    }
  }
};
