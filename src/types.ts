export type Video = { id: string; title: string; url: string };
export type Pdf = { id: string; title: string; url: string };
export type Question = { id: string; q: string; options: string[]; correctIndex: number; explanation: string };
import type { Timestamp } from 'firebase/firestore';


export type SubjectDoc = {
    id?: string;
    type: 'subject';
    name: string;
    order: number;
    createdAt?: any;
};


export type UnitDoc = {
    id?: string;
    type: 'unit';
    subjectId: string;
    name: string;
    order: number;
    createdAt?: any;
};


export type ChapterDoc = {
    id?: string;
    type: 'chapter';
    subjectId: string;
    unitId: string;
    name: string;
    order: number;
    videos: Video[];
    pdfs: Pdf[];
    questions: Question[];
    createdAt?: any;
};
export type PYQMCQ = {
    id?: string;            // Firestore doc id
    type: 'pyqmcq';        // 🔑 used in .where('type', '==', 'pyq_mcq')
    exam: string;           // e.g. 'NEET'
    year: number;           // e.g. 2024
    title?: string;         // optional display title
    questions: Question[];  // mixed subject MCQs
    createdAt?: any;

}
export type ContactDoc = {
    type?: 'contact';
    supportPhone: string;
    whatsappPhone: string;
    supportEmail: string;
    officeAddress: string;
    officeHours: string;
    mapsQueryOverride: string;
};

// src/types.ts
export type BannerDoc = {
    id: string;
    title: string;
    imageUrl: string;
    link: string;
    order: number;
    active: boolean;
    createdAt?: Timestamp | null;
};
export type FullExamPdfDoc = {
    id: string;
    exam: string;
    year: number;
    title: string;
    pdfUrl: string;
};

export type SubjectMockPdfDoc = {
    id: string;
    subjectId: string;
    subjectName?: string;
    exam: string;
    year: number;
    title: string;
    pdfUrl: string;
};

export type SubjectWithMockPapers = {
    subjectId: string;
    subjectName: string;
    papers: SubjectMockPdfDoc[];
};
