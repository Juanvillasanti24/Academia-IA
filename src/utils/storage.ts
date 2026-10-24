import { Project, StorageStats, APAConfig } from '../types';

const DB_NAME = 'academia_ia_db';
const DB_VERSION = 1;
const STORE_PROJECTS = 'projects';

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!('indexedDB' in window)) {
      reject(new Error('IndexedDB no está disponible en este navegador.'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_PROJECTS)) {
        const store = db.createObjectStore(STORE_PROJECTS, { keyPath: 'id' });
        store.createIndex('updatedAt', 'updatedAt', { unique: false });
        store.createIndex('name', 'name', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export const defaultAPAConfig: APAConfig = {
  font: 'Times New Roman',
  fontSize: 12,
  marginsCm: 2.54,
  lineSpacing: 2.0,
  firstLineIndentCm: 1.27,
  includeCover: true,
  coverType: 'student',
  studentInfo: {
    title: 'Informe Académico de Resolución de Tarea',
    studentName: 'Estudiante',
    institution: 'Institución Educativa',
    faculty: 'Facultad de Ciencias y Humanidades',
    career: 'Carrera Profesional',
    course: 'Asignatura Principal',
    instructor: 'Profesor / Docente',
    date: new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' }),
  },
  includeOriginalQuestions: true,
  includeOnlyAnswers: false,
  includeReferences: true,
  includeSourcePages: true,
  includeWarnings: true,
};

export function createNewProject(name = 'Nuevo Trabajo'): Project {
  return {
    id: 'proj_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8),
    name,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    mode: 'hybrid',
    educationLevel: 'Universidad o facultad',
    responseLength: 'Desarrollada',
    writingStyle: 'Lenguaje académico',
    strictMode: true,
    complementWithGeneral: false,
    studyMaterial: null,
    assignmentTask: null,
    questions: [],
    apaConfig: { ...defaultAPAConfig },
  };
}

export async function getAllProjects(): Promise<Project[]> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_PROJECTS, 'readonly');
      const store = tx.objectStore(STORE_PROJECTS);
      const request = store.getAll();

      request.onsuccess = () => {
        const list: Project[] = request.result || [];
        // Sort descending by updatedAt
        list.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
        resolve(list);
      };
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Error al obtener proyectos de IndexedDB:', error);
    return [];
  }
}

export async function getProject(id: string): Promise<Project | null> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_PROJECTS, 'readonly');
      const store = tx.objectStore(STORE_PROJECTS);
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error(`Error al obtener el proyecto ${id}:`, error);
    return null;
  }
}

export async function saveProject(project: Project): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_PROJECTS, 'readwrite');
    const store = tx.objectStore(STORE_PROJECTS);
    const updatedProject = {
      ...project,
      updatedAt: new Date().toISOString(),
    };
    const request = store.put(updatedProject);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function deleteProject(id: string): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_PROJECTS, 'readwrite');
    const store = tx.objectStore(STORE_PROJECTS);
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function duplicateProject(id: string): Promise<Project> {
  const original = await getProject(id);
  if (!original) throw new Error('El proyecto original no existe.');

  const duplicated: Project = {
    ...original,
    id: 'proj_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8),
    name: `${original.name} (Copia)`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await saveProject(duplicated);
  return duplicated;
}

export async function exportBackup(): Promise<string> {
  const projects = await getAllProjects();
  const backup = {
    app: 'Academia IA',
    version: '1.0.0',
    exportedAt: new Date().toISOString(),
    projects,
  };
  return JSON.stringify(backup, null, 2);
}

export async function importBackup(jsonString: string): Promise<number> {
  try {
    const data = JSON.parse(jsonString);
    if (!data.projects || !Array.isArray(data.projects)) {
      throw new Error('El archivo no tiene el formato de copia de seguridad de Academia IA.');
    }

    let count = 0;
    for (const proj of data.projects) {
      if (proj.id && proj.name) {
        await saveProject(proj);
        count++;
      }
    }
    return count;
  } catch (error: any) {
    throw new Error('Error al importar la copia de seguridad: ' + error.message);
  }
}

export async function getStorageStats(): Promise<StorageStats> {
  let usageBytes = 0;
  let quotaBytes = 0;

  if (navigator.storage && navigator.storage.estimate) {
    try {
      const estimate = await navigator.storage.estimate();
      usageBytes = estimate.usage || 0;
      quotaBytes = estimate.quota || 0;
    } catch {
      // fallback
    }
  }

  const projects = await getAllProjects();

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return {
    usageBytes,
    quotaBytes,
    usageFormatted: formatBytes(usageBytes),
    quotaFormatted: formatBytes(quotaBytes),
    percentageUsed: quotaBytes > 0 ? Math.min(100, Math.round((usageBytes / quotaBytes) * 100)) : 0,
    projectCount: projects.length,
  };
}
