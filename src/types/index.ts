export type ModeType = 'online' | 'offline' | 'hybrid';

export type EducationLevel =
  | 'Escuela'
  | 'Colegio'
  | 'Formación técnica'
  | 'Universidad o facultad';

export type ResponseLength =
  | 'Muy breve'
  | 'Breve'
  | 'Media'
  | 'Desarrollada'
  | 'Extensa';

export type WritingStyle =
  | 'Lenguaje sencillo'
  | 'Lenguaje académico'
  | 'Lenguaje técnico'
  | 'Respuesta directa'
  | 'Explicación paso a paso';

export type DocumentCategory = 'study_material' | 'assignment_task';

export interface DocumentPage {
  pageNum: number;
  text: string;
  hasImages: boolean;
  isScanned?: boolean;
  ocrApplied?: boolean;
  ocrConfidence?: number;
}

export interface ProcessedDocument {
  id: string;
  category: DocumentCategory;
  name: string;
  size: number;
  type: string; // 'application/pdf' | 'docx' etc.
  format: 'docx' | 'pdf' | 'image' | 'text';
  text: string;
  pageCount: number;
  wordCount: number;
  headings: string[];
  pages: DocumentPage[];
  uploadedAt: string;
  status: 'ready' | 'processing' | 'error' | 'ocr_pending';
  errorMessage?: string;
}

export interface DocumentChunk {
  chunkIndex: number;
  docTitle: string;
  page: string;
  section: string;
  text: string;
  keywords?: string[];
}

export interface QuestionCitation {
  fragmentIndex?: number;
  docTitle?: string;
  page?: string;
  section?: string;
  quoteExcerpt: string;
  confidence?: number;
}

export interface AcademicQuestion {
  id: string;
  number: string;
  prompt: string;
  instructionType?: string;
  subQuestions?: string[];
  answer: string;
  originalAnswer?: string;
  isEdited?: boolean;
  status: 'pending' | 'sufficient' | 'partial' | 'insufficient' | 'error';
  citations: QuestionCitation[];
  warnings: string[];
  modeUsed: 'online' | 'offline' | 'hybrid';
  missingInfoNotice?: string;
  complementaryNote?: string;
}

export interface StudentInfo {
  title: string;
  studentName: string;
  institution: string;
  faculty: string;
  career: string;
  course: string;
  instructor: string;
  date: string;
}

export interface APAConfig {
  font: 'Times New Roman' | 'Arial' | 'Calibri' | 'Georgia' | 'Lucida Sans Unicode';
  fontSize: 10 | 11 | 12;
  marginsCm: number; // 2.54
  lineSpacing: number; // 2.0
  firstLineIndentCm: number; // 1.27
  includeCover: boolean;
  coverType: 'student' | 'simple' | 'none';
  studentInfo: StudentInfo;
  includeOriginalQuestions: boolean;
  includeOnlyAnswers: boolean;
  includeReferences: boolean;
  includeSourcePages: boolean;
  includeWarnings: boolean;
}

export interface Project {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  mode: ModeType;
  educationLevel: EducationLevel;
  responseLength: ResponseLength;
  writingStyle: WritingStyle;
  strictMode: boolean; // "Responder únicamente con el material proporcionado"
  complementWithGeneral: boolean;
  studyMaterial: ProcessedDocument | null;
  assignmentTask: ProcessedDocument | null;
  questions: AcademicQuestion[];
  apaConfig: APAConfig;
  summary?: string;
  topics?: string[];
}

export interface StorageStats {
  usageBytes: number;
  quotaBytes: number;
  usageFormatted: string;
  quotaFormatted: string;
  percentageUsed: number;
  projectCount: number;
}
