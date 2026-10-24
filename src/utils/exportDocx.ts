import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  Header,
  PageNumber,
  PageBreak,
} from 'docx';
import { Project } from '../types';

/**
 * Generates an editable Microsoft Word (.docx) file adhering to APA 7th edition standards
 */
export async function exportToDocx(project: Project): Promise<Blob> {
  const { apaConfig, questions, studyMaterial } = project;
  const { studentInfo } = apaConfig;

  const fontName = apaConfig.font;
  // Font size in half-points for docx (e.g. 12pt = 24 half-points)
  const fontSizeHalfPt = apaConfig.fontSize * 2;

  const children: Paragraph[] = [];

  // ==================== 1. APA 7 STUDENT TITLE PAGE ====================
  if (apaConfig.includeCover && apaConfig.coverType === 'student') {
    // 3 to 4 double-spaced empty lines
    children.push(new Paragraph({ spacing: { line: 480 } }));
    children.push(new Paragraph({ spacing: { line: 480 } }));
    children.push(new Paragraph({ spacing: { line: 480 } }));

    // Paper Title (Bold, Centered)
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { line: 480, after: 240 },
        children: [
          new TextRun({
            text: studentInfo.title || project.name,
            bold: true,
            font: fontName,
            size: fontSizeHalfPt,
          }),
        ],
      })
    );

    // Empty space between title and author
    children.push(new Paragraph({ spacing: { line: 480 } }));

    // Author / Student Name
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { line: 480 },
        children: [
          new TextRun({
            text: studentInfo.studentName || 'Estudiante',
            font: fontName,
            size: fontSizeHalfPt,
          }),
        ],
      })
    );

    // Affiliation / Institution
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { line: 480 },
        children: [
          new TextRun({
            text: `${studentInfo.faculty || 'Facultad'} - ${studentInfo.institution || 'Universidad'}`,
            font: fontName,
            size: fontSizeHalfPt,
          }),
        ],
      })
    );

    // Course Name and Number
    if (studentInfo.course) {
      children.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { line: 480 },
          children: [
            new TextRun({
              text: studentInfo.course,
              font: fontName,
              size: fontSizeHalfPt,
            }),
          ],
        })
      );
    }

    // Instructor Name
    if (studentInfo.instructor) {
      children.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { line: 480 },
          children: [
            new TextRun({
              text: `Prof. ${studentInfo.instructor}`,
              font: fontName,
              size: fontSizeHalfPt,
            }),
          ],
        })
      );
    }

    // Assignment Due Date
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { line: 480 },
        children: [
          new TextRun({
            text: studentInfo.date || new Date().toLocaleDateString('es-ES'),
            font: fontName,
            size: fontSizeHalfPt,
          }),
        ],
      })
    );

    // Page Break after title page
    children.push(
      new Paragraph({
        children: [new PageBreak()],
      })
    );
  }

  // ==================== 2. MAIN BODY (PAGE 2) ====================
  // APA 7 repeats title at top of first page of text (Centered, Bold)
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { line: 480, after: 240 },
      heading: HeadingLevel.HEADING_1,
      children: [
        new TextRun({
          text: studentInfo.title || project.name,
          bold: true,
          font: fontName,
          size: fontSizeHalfPt,
        }),
      ],
    })
  );

  // Questions and Answers
  for (const q of questions) {
    // Heading 2 for Question Number (Flush left, Bold)
    children.push(
      new Paragraph({
        alignment: AlignmentType.LEFT,
        spacing: { line: 480, before: 360, after: 120 },
        heading: HeadingLevel.HEADING_2,
        children: [
          new TextRun({
            text: `Pregunta ${q.number}`,
            bold: true,
            font: fontName,
            size: fontSizeHalfPt,
          }),
        ],
      })
    );

    // Original Prompt if enabled
    if (apaConfig.includeOriginalQuestions) {
      children.push(
        new Paragraph({
          alignment: AlignmentType.LEFT,
          spacing: { line: 480, after: 180 },
          indent: { firstLine: 720 }, // 1.27 cm first line indent
          children: [
            new TextRun({
              text: q.prompt,
              italics: true,
              font: fontName,
              size: fontSizeHalfPt,
            }),
          ],
        })
      );
    }

    // Answer paragraphs with double spacing and APA 1.27 cm indent
    const answerParagraphs = (q.answer || 'Sin respuesta.')
      .split(/\n\s*\n|\r\n\s*\r\n/)
      .map((p) => p.trim())
      .filter(Boolean);

    for (const pText of answerParagraphs) {
      children.push(
        new Paragraph({
          alignment: AlignmentType.LEFT,
          spacing: { line: 480, after: 0 },
          indent: { firstLine: 720 }, // 1.27 cm first line indent
          children: [
            new TextRun({
              text: pText,
              font: fontName,
              size: fontSizeHalfPt,
            }),
          ],
        })
      );
    }

    // Source Citations if enabled
    if (apaConfig.includeSourcePages && q.citations && q.citations.length > 0) {
      const citationsText = q.citations
        .map((c) => `(${c.docTitle || 'Material de estudio'}, ${c.page || 's. p.'}, ${c.section || 'General'})`)
        .join('; ');

      children.push(
        new Paragraph({
          alignment: AlignmentType.LEFT,
          spacing: { line: 480, before: 120, after: 180 },
          indent: { firstLine: 720 },
          children: [
            new TextRun({
              text: `Referencia interna: ${citationsText}`,
              font: fontName,
              size: fontSizeHalfPt - 2,
              color: '555555',
            }),
          ],
        })
      );
    }

    // Warning about insufficient info if applicable
    if (apaConfig.includeWarnings && (q.status === 'insufficient' || q.status === 'partial')) {
      children.push(
        new Paragraph({
          alignment: AlignmentType.LEFT,
          spacing: { line: 480, after: 180 },
          indent: { firstLine: 720 },
          children: [
            new TextRun({
              text: `[Nota de fidelidad documental: ${q.missingInfoNotice || 'Información no encontrada completamente en la fuente'}]`,
              font: fontName,
              size: fontSizeHalfPt - 2,
              italics: true,
              color: '885500',
            }),
          ],
        })
      );
    }
  }

  // ==================== 3. REFERENCES SECTION ====================
  if (apaConfig.includeReferences) {
    children.push(
      new Paragraph({
        children: [new PageBreak()],
      })
    );

    // References Title (Centered, Bold)
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { line: 480, after: 240 },
        children: [
          new TextRun({
            text: 'Referencias',
            bold: true,
            font: fontName,
            size: fontSizeHalfPt,
          }),
        ],
      })
    );

    // Primary document reference with APA hanging indent (sangría francesa 0.5 in / 720 twip)
    const docTitle = studyMaterial?.name || 'Material de estudio proporcionado por el docente';
    const currentYear = new Date().getFullYear();

    children.push(
      new Paragraph({
        alignment: AlignmentType.LEFT,
        spacing: { line: 480, after: 240 },
        indent: { left: 720, hanging: 720 }, // APA 7 Hanging indent
        children: [
          new TextRun({
            text: `${studentInfo.institution || 'Cátedra Académica'}. (${currentYear}). `,
            font: fontName,
            size: fontSizeHalfPt,
          }),
          new TextRun({
            text: `${docTitle}. `,
            italics: true,
            font: fontName,
            size: fontSizeHalfPt,
          }),
          new TextRun({
            text: `Documento de estudio y guía práctica del curso de ${studentInfo.course || 'la asignatura'}.`,
            font: fontName,
            size: fontSizeHalfPt,
          }),
        ],
      })
    );
  }

  // Create Docx document with 1 inch (1440 twips = 2.54 cm) margins and page number header
  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1440,
              right: 1440,
              bottom: 1440,
              left: 1440,
            },
          },
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({
                    children: [PageNumber.CURRENT],
                    font: fontName,
                    size: fontSizeHalfPt,
                  }),
                ],
              }),
            ],
          }),
        },
        children,
      },
    ],
  });

  return await Packer.toBlob(doc);
}

/**
 * Triggers file download in browser
 */
export function downloadFile(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
