import { jsPDF } from 'jspdf';
import { Project } from '../types';

export function exportToPdf(project: Project): Blob {
  const { apaConfig, questions, studyMaterial } = project;
  const { studentInfo } = apaConfig;

  // Initialize Letter size in mm
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'letter',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 25.4; // 1 inch = 2.54 cm = 25.4 mm
  const contentWidth = pageWidth - 2 * margin;

  // Select standard font
  let baseFont = 'times';
  if (apaConfig.font === 'Arial' || apaConfig.font === 'Calibri') {
    baseFont = 'helvetica';
  }

  const fontSize = apaConfig.fontSize || 12;
  const lineHeight = (fontSize * 0.3527 * 2.0); // double spacing in mm
  const indentMm = 12.7; // 1.27 cm first-line indent

  let currentPage = 1;

  function renderHeader() {
    doc.setFont(baseFont, 'normal');
    doc.setFontSize(fontSize);
    doc.setTextColor(30, 30, 30);
    // Page number in top right corner (margin from top ~15mm, right margin 25.4mm)
    doc.text(String(currentPage), pageWidth - margin, 18, { align: 'right' });
  }

  let y = margin;

  // ==================== 1. TITLE PAGE ====================
  if (apaConfig.includeCover && apaConfig.coverType === 'student') {
    renderHeader();

    // Position title approx 1/3 down the page
    y = 75;
    doc.setFont(baseFont, 'bold');
    doc.setFontSize(fontSize);

    const titleLines = doc.splitTextToSize(studentInfo.title || project.name, contentWidth);
    doc.text(titleLines, pageWidth / 2, y, { align: 'center' });
    y += titleLines.length * lineHeight + lineHeight;

    doc.setFont(baseFont, 'normal');
    const authorLines = [
      studentInfo.studentName || 'Estudiante',
      `${studentInfo.faculty || 'Facultad'} - ${studentInfo.institution || 'Universidad'}`,
      studentInfo.course || '',
      studentInfo.instructor ? `Prof. ${studentInfo.instructor}` : '',
      studentInfo.date || new Date().toLocaleDateString('es-ES'),
    ].filter(Boolean);

    for (const line of authorLines) {
      doc.text(line, pageWidth / 2, y, { align: 'center' });
      y += lineHeight;
    }

    doc.addPage();
    currentPage++;
    y = margin;
  }

  renderHeader();

  // ==================== 2. BODY ====================
  // Repeat title at top of page (centered, bold)
  doc.setFont(baseFont, 'bold');
  doc.setFontSize(fontSize);
  const bodyTitleLines = doc.splitTextToSize(studentInfo.title || project.name, contentWidth);
  doc.text(bodyTitleLines, pageWidth / 2, y + 4, { align: 'center' });
  y += bodyTitleLines.length * lineHeight + 4;

  for (const q of questions) {
    // Check page overflow
    if (y > pageHeight - margin - 20) {
      doc.addPage();
      currentPage++;
      renderHeader();
      y = margin;
    }

    // Question Number Heading (Flush left, bold)
    doc.setFont(baseFont, 'bold');
    doc.setFontSize(fontSize);
    doc.text(`Pregunta ${q.number}`, margin, y);
    y += lineHeight;

    // Original Prompt if enabled
    if (apaConfig.includeOriginalQuestions) {
      doc.setFont(baseFont, 'italic');
      const promptLines = doc.splitTextToSize(q.prompt, contentWidth - indentMm);
      // First line indent
      doc.text(promptLines[0] || '', margin + indentMm, y);
      y += lineHeight;
      for (let i = 1; i < promptLines.length; i++) {
        if (y > pageHeight - margin - 15) {
          doc.addPage();
          currentPage++;
          renderHeader();
          y = margin;
        }
        doc.text(promptLines[i], margin, y);
        y += lineHeight;
      }
    }

    // Answer Paragraphs (Double-spaced, first line indented 1.27 cm)
    doc.setFont(baseFont, 'normal');
    const answerParagraphs = (q.answer || 'Sin respuesta.')
      .split(/\n\s*\n|\r\n\s*\r\n/)
      .map((p) => p.trim())
      .filter(Boolean);

    for (const para of answerParagraphs) {
      const paraLines = doc.splitTextToSize(para, contentWidth - indentMm);
      if (paraLines.length === 0) continue;

      if (y > pageHeight - margin - 15) {
        doc.addPage();
        currentPage++;
        renderHeader();
        y = margin;
      }

      // First line indented
      doc.text(paraLines[0], margin + indentMm, y);
      y += lineHeight;

      for (let i = 1; i < paraLines.length; i++) {
        if (y > pageHeight - margin - 15) {
          doc.addPage();
          currentPage++;
          renderHeader();
          y = margin;
        }
        doc.text(paraLines[i], margin, y);
        y += lineHeight;
      }
    }

    // Citation note
    if (apaConfig.includeSourcePages && q.citations && q.citations.length > 0) {
      const citeText = 'Referencia interna: ' + q.citations
        .map((c) => `(${c.docTitle || 'Material'}, ${c.page || 's. p.'}, ${c.section || 'General'})`)
        .join('; ');

      doc.setFont(baseFont, 'italic');
      doc.setFontSize(fontSize - 1);
      doc.setTextColor(90, 90, 90);
      const citeLines = doc.splitTextToSize(citeText, contentWidth - indentMm);
      for (const cl of citeLines) {
        if (y > pageHeight - margin - 15) {
          doc.addPage();
          currentPage++;
          renderHeader();
          y = margin;
        }
        doc.text(cl, margin + indentMm, y);
        y += lineHeight * 0.8;
      }
      doc.setTextColor(30, 30, 30);
      doc.setFontSize(fontSize);
    }

    // Warning note if insufficient
    if (apaConfig.includeWarnings && (q.status === 'insufficient' || q.status === 'partial')) {
      doc.setFont(baseFont, 'italic');
      doc.setFontSize(fontSize - 1);
      doc.setTextColor(180, 80, 0);
      const warnText = `[Nota de fidelidad: ${q.missingInfoNotice || 'Información no encontrada completamente en la fuente'}]`;
      const warnLines = doc.splitTextToSize(warnText, contentWidth - indentMm);
      for (const wl of warnLines) {
        if (y > pageHeight - margin - 15) {
          doc.addPage();
          currentPage++;
          renderHeader();
          y = margin;
        }
        doc.text(wl, margin + indentMm, y);
        y += lineHeight * 0.8;
      }
      doc.setTextColor(30, 30, 30);
      doc.setFontSize(fontSize);
    }

    y += 4; // slight spacing before next question
  }

  // ==================== 3. REFERENCES ====================
  if (apaConfig.includeReferences) {
    doc.addPage();
    currentPage++;
    renderHeader();
    y = margin;

    // Heading "Referencias"
    doc.setFont(baseFont, 'bold');
    doc.setFontSize(fontSize);
    doc.text('Referencias', pageWidth / 2, y, { align: 'center' });
    y += lineHeight + 4;

    doc.setFont(baseFont, 'normal');
    const docTitle = studyMaterial?.name || 'Material de estudio proporcionado por el docente';
    const currentYear = new Date().getFullYear();
    const refText = `${studentInfo.institution || 'Cátedra Académica'}. (${currentYear}). ${docTitle}. Documento de estudio y guía práctica del curso de ${studentInfo.course || 'la asignatura'}.`;

    const refLines = doc.splitTextToSize(refText, contentWidth - indentMm);
    if (refLines.length > 0) {
      // First line flush left
      doc.text(refLines[0], margin, y);
      y += lineHeight;

      // Subsequent lines indented (hanging indent)
      for (let i = 1; i < refLines.length; i++) {
        if (y > pageHeight - margin - 15) {
          doc.addPage();
          currentPage++;
          renderHeader();
          y = margin;
        }
        doc.text(refLines[i], margin + indentMm, y);
        y += lineHeight;
      }
    }
  }

  return doc.output('blob');
}
