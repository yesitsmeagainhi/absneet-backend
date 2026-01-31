// // src/admin/PYQMCQ.tsx (or wherever you keep this component)
// import React, { useEffect, useState } from 'react';
// import {
//     collection,
//     getDocs,
//     addDoc,
//     updateDoc,
//     deleteDoc,
//     doc,
//     orderBy,
//     query,
//     where,
// } from 'firebase/firestore';
// import { db } from '../firebase';

// /** Same shape as app side */
// type Question = {
//     id: string;
//     q: string;
//     options: string[];
//     correctIndex: number;
//     explanation?: string;   // ✅ explanation field
// };

// type PYQPaperDoc = {
//     id: string;
//     exam: string;
//     year: number;
//     title: string;
//     questions: Question[];
// };

// const nodesCol = collection(db, 'nodes');

// function makeEmptyQuestion(): Question {
//     const id =
//         typeof crypto !== 'undefined' && 'randomUUID' in crypto
//             ? crypto.randomUUID()
//             : `q_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

//     return {
//         id,
//         q: '',
//         options: ['', '', '', ''],
//         correctIndex: 0,
//         explanation: '',       // ✅ default empty explanation
//     };
// }

// export default function PYQMCQ() {
//     const [papers, setPapers] = useState<PYQPaperDoc[]>([]);
//     const [loading, setLoading] = useState(false);
//     const [saving, setSaving] = useState(false);
//     const [error, setError] = useState<string | null>(null);

//     const [currentId, setCurrentId] = useState<string | null>(null);
//     const [current, setCurrent] = useState<PYQPaperDoc | null>(null);

//     // ───────────────── Load all PYQ MCQ papers ─────────────────
//     const loadPapers = async () => {
//         try {
//             setLoading(true);
//             setError(null);

//             const qy = query(
//                 nodesCol,
//                 where('type', '==', 'pyq_mcq'),
//                 orderBy('year', 'desc'),
//             );

//             const snap = await getDocs(qy);

//             const list: PYQPaperDoc[] = snap.docs.map(d => {
//                 const data = d.data() as any;
//                 const rawQs: any[] = Array.isArray(data.questions) ? data.questions : [];

//                 const questions: Question[] = rawQs.map((q: any, idx: number) => ({
//                     id: q.id || `${d.id}_${idx}`,
//                     q: q.q ?? '',
//                     options: Array.isArray(q.options) ? q.options : ['', '', '', ''],
//                     correctIndex: typeof q.correctIndex === 'number' ? q.correctIndex : 0,
//                     explanation: q.explanation ?? '',   // ✅ load explanation
//                 }));

//                 return {
//                     id: d.id,
//                     exam: data.exam ?? 'NEET',
//                     year: Number(data.year) || 0,
//                     title: data.title ?? `${data.exam ?? 'NEET'} ${data.year ?? ''} – Full Exam`,
//                     questions,
//                 };
//             });

//             setPapers(list);

//             if (!currentId && list.length > 0) {
//                 setCurrentId(list[0].id);
//                 setCurrent(list[0]);
//             }
//         } catch (e: any) {
//             console.error('[PYQMcqAdmin] load error', e);
//             setError('Failed to load PYQ MCQ papers from Firestore.');
//         } finally {
//             setLoading(false);
//         }
//     };

//     useEffect(() => {
//         loadPapers();
//         // eslint-disable-next-line react-hooks/exhaustive-deps
//     }, []);

//     // ───────────────── Select paper ─────────────────
//     const handleSelectPaper = (id: string) => {
//         const found = papers.find(p => p.id === id) || null;
//         setCurrentId(id);
//         setCurrent(found);
//     };

//     // ───────────────── Create new year set ─────────────────
//     const handleNewPaper = () => {
//         const year = new Date().getFullYear();

//         const fresh: PYQPaperDoc = {
//             id: '_new_',
//             exam: 'NEET',
//             year,
//             title: `NEET ${year} – Full Exam`,
//             questions: [makeEmptyQuestion()],
//         };

//         setCurrentId('_new_');
//         setCurrent(fresh);
//     };

//     // ───────────────── Update meta fields ─────────────────
//     const updateCurrent = <K extends keyof PYQPaperDoc>(
//         key: K,
//         value: PYQPaperDoc[K],
//     ) => {
//         setCurrent(prev => (prev ? { ...prev, [key]: value } : prev));
//     };

//     // ───────────────── Question operations ─────────────────
//     const handleAddQuestion = () => {
//         setCurrent(prev =>
//             prev
//                 ? {
//                     ...prev,
//                     questions: [...prev.questions, makeEmptyQuestion()],
//                 }
//                 : prev,
//         );
//     };

//     const handleDeleteQuestion = (qid: string) => {
//         setCurrent(prev =>
//             prev
//                 ? {
//                     ...prev,
//                     questions: prev.questions.filter(q => q.id !== qid),
//                 }
//                 : prev,
//         );
//     };

//     const handleUpdateQuestionField = (
//         qid: string,
//         field: keyof Question,
//         value: any,
//     ) => {
//         setCurrent(prev =>
//             prev
//                 ? {
//                     ...prev,
//                     questions: prev.questions.map(q =>
//                         q.id === qid ? { ...q, [field]: value } : q,
//                     ),
//                 }
//                 : prev,
//         );
//     };

//     const handleUpdateOption = (qid: string, optIndex: number, value: string) => {
//         setCurrent(prev =>
//             prev
//                 ? {
//                     ...prev,
//                     questions: prev.questions.map(q => {
//                         if (q.id !== qid) return q;
//                         const copy = [...q.options];
//                         copy[optIndex] = value;
//                         return { ...q, options: copy };
//                     }),
//                 }
//                 : prev,
//         );
//     };

//     // ───────────────── Save (create/update) ─────────────────
//     const handleSave = async () => {
//         if (!current) return;

//         if (!current.year || !current.exam) {
//             alert('Please enter exam name and year.');
//             return;
//         }

//         if (!current.questions.length) {
//             const ok = window.confirm(
//                 'This set has 0 questions. Do you still want to save it?',
//             );
//             if (!ok) return;
//         }

//         try {
//             setSaving(true);
//             setError(null);

//             const payload = {
//                 type: 'pyq_mcq', // 🔑 important for filter in app + admin
//                 exam: current.exam,
//                 year: current.year,
//                 title: current.title,
//                 questions: current.questions.map(q => ({
//                     id: q.id,
//                     q: q.q,
//                     options: q.options,
//                     correctIndex: q.correctIndex,
//                     explanation: q.explanation ?? '', // ✅ save explanation
//                 })),
//             };

//             if (current.id === '_new_') {
//                 await addDoc(nodesCol, payload);
//             } else {
//                 const ref = doc(nodesCol, current.id);
//                 await updateDoc(ref, payload);
//             }

//             await loadPapers();
//             alert('Saved successfully.');
//         } catch (e: any) {
//             console.error('[PYQMcqAdmin] save error', e);
//             setError('Failed to save. Check console for details.');
//         } finally {
//             setSaving(false);
//         }
//     };

//     // ───────────────── Delete entire year set ─────────────────
//     const handleDeletePaper = async () => {
//         if (!current || current.id === '_new_') return;

//         const ok = window.confirm(
//             `Delete ${current.exam} ${current.year} paper and all its questions?`,
//         );
//         if (!ok) return;

//         try {
//             setSaving(true);
//             setError(null);

//             const ref = doc(nodesCol, current.id);
//             await deleteDoc(ref);

//             setCurrent(null);
//             setCurrentId(null);
//             await loadPapers();
//         } catch (e: any) {
//             console.error('[PYQMcqAdmin] delete error', e);
//             setError('Failed to delete paper.');
//         } finally {
//             setSaving(false);
//         }
//     };

//     // ───────────────── UI ─────────────────
//     return (
//         <div
//             style={{
//                 display: 'flex',
//                 height: '100vh',
//                 fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
//                 background: '#0b1120',
//                 color: '#e5e7eb',
//             }}
//         >
//             {/* LEFT: list of years */}
//             <div
//                 style={{
//                     width: 260,
//                     borderRight: '1px solid #1f2937',
//                     padding: '16px',
//                     boxSizing: 'border-box',
//                     background: '#020617',
//                 }}
//             >
//                 <h2 style={{ fontSize: 18, marginBottom: 8 }}>PYQ MCQ Admin</h2>
//                 <p style={{ fontSize: 12, color: '#9ca3af', marginBottom: 12 }}>
//                     Manage NEET previous year MCQ sets by year.
//                 </p>

//                 <button
//                     onClick={handleNewPaper}
//                     style={{
//                         width: '100%',
//                         padding: '8px 10px',
//                         borderRadius: 999,
//                         border: 'none',
//                         cursor: 'pointer',
//                         background: '#22c55e',
//                         color: '#022c22',
//                         fontWeight: 600,
//                         fontSize: 13,
//                         marginBottom: 10,
//                     }}
//                 >
//                     + New Year Set
//                 </button>

//                 {loading && (
//                     <p style={{ fontSize: 12, color: '#9ca3af' }}>Loading…</p>
//                 )}

//                 {error && <p style={{ fontSize: 12, color: '#f97373' }}>{error}</p>}

//                 <div
//                     style={{
//                         marginTop: 8,
//                         borderTop: '1px solid #1f2937',
//                         paddingTop: 8,
//                         overflowY: 'auto',
//                         maxHeight: 'calc(100vh - 170px)',
//                     }}
//                 >
//                     {papers.length === 0 ? (
//                         <p style={{ fontSize: 12, color: '#9ca3af' }}>
//                             No PYQ MCQ sets yet.
//                         </p>
//                     ) : (
//                         papers.map(p => (
//                             <div
//                                 key={p.id}
//                                 onClick={() => handleSelectPaper(p.id)}
//                                 style={{
//                                     padding: '8px 10px',
//                                     borderRadius: 10,
//                                     marginBottom: 6,
//                                     cursor: 'pointer',
//                                     background: currentId === p.id ? '#1e293b' : 'transparent',
//                                     border:
//                                         currentId === p.id
//                                             ? '1px solid #38bdf8'
//                                             : '1px solid transparent',
//                                 }}
//                             >
//                                 <div
//                                     style={{
//                                         fontSize: 13,
//                                         fontWeight: 600,
//                                         color: '#e5e7eb',
//                                     }}
//                                 >
//                                     {p.exam} {p.year}
//                                 </div>
//                                 <div
//                                     style={{
//                                         fontSize: 11,
//                                         color: '#9ca3af',
//                                     }}
//                                 >
//                                     {p.questions.length} questions
//                                 </div>
//                             </div>
//                         ))
//                     )}
//                 </div>
//             </div>

//             {/* RIGHT: editor */}
//             <div
//                 style={{
//                     flex: 1,
//                     padding: '16px 20px',
//                     boxSizing: 'border-box',
//                     overflowY: 'auto',
//                 }}
//             >
//                 {!current ? (
//                     <div
//                         style={{
//                             marginTop: 40,
//                             textAlign: 'center',
//                             color: '#9ca3af',
//                             fontSize: 14,
//                         }}
//                     >
//                         Select a year from the left, or create a new set.
//                     </div>
//                 ) : (
//                     <>
//                         {/* Meta section */}
//                         <div
//                             style={{
//                                 display: 'flex',
//                                 gap: 12,
//                                 marginBottom: 16,
//                                 alignItems: 'flex-end',
//                             }}
//                         >
//                             <div>
//                                 <label
//                                     style={{
//                                         fontSize: 12,
//                                         color: '#9ca3af',
//                                         display: 'block',
//                                         marginBottom: 4,
//                                     }}
//                                 >
//                                     Exam
//                                 </label>
//                                 <input
//                                     value={current.exam}
//                                     onChange={e => updateCurrent('exam', e.target.value)}
//                                     style={{
//                                         padding: '6px 8px',
//                                         borderRadius: 8,
//                                         border: '1px solid #1f2937',
//                                         background: '#020617',
//                                         color: '#e5e7eb',
//                                         fontSize: 13,
//                                         minWidth: 120,
//                                     }}
//                                 />
//                             </div>

//                             <div>
//                                 <label
//                                     style={{
//                                         fontSize: 12,
//                                         color: '#9ca3af',
//                                         display: 'block',
//                                         marginBottom: 4,
//                                     }}
//                                 >
//                                     Year
//                                 </label>
//                                 <input
//                                     type="number"
//                                     value={current.year}
//                                     onChange={e =>
//                                         updateCurrent('year', Number(e.target.value) || 0)
//                                     }
//                                     style={{
//                                         padding: '6px 8px',
//                                         borderRadius: 8,
//                                         border: '1px solid #1f2937',
//                                         background: '#020617',
//                                         color: '#e5e7eb',
//                                         fontSize: 13,
//                                         width: 100,
//                                     }}
//                                 />
//                             </div>

//                             <div style={{ flex: 1 }}>
//                                 <label
//                                     style={{
//                                         fontSize: 12,
//                                         color: '#9ca3af',
//                                         display: 'block',
//                                         marginBottom: 4,
//                                     }}
//                                 >
//                                     Title (optional)
//                                 </label>
//                                 <input
//                                     value={current.title}
//                                     onChange={e => updateCurrent('title', e.target.value)}
//                                     style={{
//                                         padding: '6px 8px',
//                                         borderRadius: 8,
//                                         border: '1px solid #1f2937',
//                                         background: '#020617',
//                                         color: '#e5e7eb',
//                                         fontSize: 13,
//                                         width: '100%',
//                                     }}
//                                 />
//                             </div>

//                             <div style={{ display: 'flex', gap: 8 }}>
//                                 <button
//                                     onClick={handleSave}
//                                     disabled={saving}
//                                     style={{
//                                         padding: '8px 12px',
//                                         borderRadius: 999,
//                                         border: 'none',
//                                         cursor: 'pointer',
//                                         background: '#38bdf8',
//                                         color: '#0f172a',
//                                         fontWeight: 600,
//                                         fontSize: 13,
//                                         opacity: saving ? 0.7 : 1,
//                                     }}
//                                 >
//                                     {saving ? 'Saving…' : 'Save'}
//                                 </button>

//                                 {current.id !== '_new_' && (
//                                     <button
//                                         onClick={handleDeletePaper}
//                                         disabled={saving}
//                                         style={{
//                                             padding: '8px 12px',
//                                             borderRadius: 999,
//                                             border: '1px solid #f97373',
//                                             cursor: 'pointer',
//                                             background: 'transparent',
//                                             color: '#fca5a5',
//                                             fontWeight: 600,
//                                             fontSize: 13,
//                                         }}
//                                     >
//                                         Delete
//                                     </button>
//                                 )}
//                             </div>
//                         </div>

//                         {/* Questions header */}
//                         <div
//                             style={{
//                                 display: 'flex',
//                                 justifyContent: 'space-between',
//                                 alignItems: 'center',
//                                 marginBottom: 8,
//                             }}
//                         >
//                             <div>
//                                 <h3 style={{ fontSize: 16, margin: 0 }}>
//                                     Questions ({current.questions.length})
//                                 </h3>
//                                 <p
//                                     style={{
//                                         fontSize: 11,
//                                         color: '#9ca3af',
//                                         marginTop: 2,
//                                     }}
//                                 >
//                                     Each question should have 4 options. Select the correct one
//                                     with the radio button. Explanation will be shown in the app
//                                     when the student answers incorrectly.
//                                 </p>
//                             </div>

//                             <button
//                                 onClick={handleAddQuestion}
//                                 style={{
//                                     padding: '6px 10px',
//                                     borderRadius: 999,
//                                     border: 'none',
//                                     cursor: 'pointer',
//                                     background: '#22c55e',
//                                     color: '#022c22',
//                                     fontWeight: 600,
//                                     fontSize: 12,
//                                 }}
//                             >
//                                 + Add Question
//                             </button>
//                         </div>

//                         {/* Questions list */}
//                         <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
//                             {current.questions.map((q, idx) => (
//                                 <div
//                                     key={q.id}
//                                     style={{
//                                         borderRadius: 10,
//                                         border: '1px solid #1f2937',
//                                         padding: '10px 12px',
//                                         background: '#020617',
//                                     }}
//                                 >
//                                     <div
//                                         style={{
//                                             display: 'flex',
//                                             justifyContent: 'space-between',
//                                             alignItems: 'center',
//                                             marginBottom: 6,
//                                         }}
//                                     >
//                                         <span
//                                             style={{
//                                                 fontSize: 12,
//                                                 color: '#9ca3af',
//                                             }}
//                                         >
//                                             Q{idx + 1}
//                                         </span>
//                                         <button
//                                             onClick={() => handleDeleteQuestion(q.id)}
//                                             style={{
//                                                 border: 'none',
//                                                 background: 'transparent',
//                                                 cursor: 'pointer',
//                                                 fontSize: 11,
//                                                 color: '#fca5a5',
//                                             }}
//                                         >
//                                             Delete
//                                         </button>
//                                     </div>

//                                     <textarea
//                                         value={q.q}
//                                         onChange={e =>
//                                             handleUpdateQuestionField(q.id, 'q', e.target.value)
//                                         }
//                                         placeholder="Question text"
//                                         rows={2}
//                                         style={{
//                                             width: '100%',
//                                             borderRadius: 8,
//                                             border: '1px solid #1f2937',
//                                             background: '#020617',
//                                             color: '#e5e7eb',
//                                             fontSize: 13,
//                                             padding: '6px 8px',
//                                             marginBottom: 6,
//                                             resize: 'vertical',
//                                         }}
//                                     />

//                                     <div
//                                         style={{
//                                             display: 'grid',
//                                             gridTemplateColumns: '1fr 1fr',
//                                             gap: 8,
//                                             marginBottom: 6,
//                                         }}
//                                     >
//                                         {q.options.map((opt, i) => (
//                                             <label
//                                                 key={i}
//                                                 style={{
//                                                     display: 'flex',
//                                                     alignItems: 'center',
//                                                     gap: 6,
//                                                     fontSize: 12,
//                                                     color: '#e5e7eb',
//                                                 }}
//                                             >
//                                                 <input
//                                                     type="radio"
//                                                     name={`correct_${q.id}`}
//                                                     checked={q.correctIndex === i}
//                                                     onChange={() =>
//                                                         handleUpdateQuestionField(q.id, 'correctIndex', i)
//                                                     }
//                                                 />
//                                                 <input
//                                                     value={opt}
//                                                     onChange={e =>
//                                                         handleUpdateOption(q.id, i, e.target.value)
//                                                     }
//                                                     placeholder={`Option ${i + 1}`}
//                                                     style={{
//                                                         flex: 1,
//                                                         padding: '4px 6px',
//                                                         borderRadius: 6,
//                                                         border: '1px solid #1f2937',
//                                                         background: '#020617',
//                                                         color: '#e5e7eb',
//                                                         fontSize: 12,
//                                                     }}
//                                                 />
//                                             </label>
//                                         ))}
//                                     </div>

//                                     {/* ✅ Explanation field */}
//                                     <label
//                                         style={{
//                                             fontSize: 11,
//                                             color: '#9ca3af',
//                                             display: 'block',
//                                             marginBottom: 2,
//                                         }}
//                                     >
//                                         Explanation (shown in app after a wrong answer)
//                                     </label>
//                                     <textarea
//                                         value={q.explanation || ''}
//                                         onChange={e =>
//                                             handleUpdateQuestionField(
//                                                 q.id,
//                                                 'explanation',
//                                                 e.target.value,
//                                             )
//                                         }
//                                         placeholder="Explain why this option is correct. Students will see this when they get it wrong."
//                                         rows={2}
//                                         style={{
//                                             width: '100%',
//                                             borderRadius: 8,
//                                             border: '1px solid #1f2937',
//                                             background: '#020617',
//                                             color: '#e5e7eb',
//                                             fontSize: 12,
//                                             padding: '6px 8px',
//                                             resize: 'vertical',
//                                         }}
//                                     />
//                                 </div>
//                             ))}
//                         </div>
//                     </>
//                 )}
//             </div>
//         </div>
//     );
// }


// src/admin/PYQMCQ.tsx
import React, { useEffect, useState } from 'react';
import {
    collection,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    orderBy,
    query,
    where,
    getDoc,
} from 'firebase/firestore';
import { db } from '../firebase';
import * as XLSX from 'xlsx';
import ImageUploader from '../components/ImageUploader';

type Question = {
    id: string;
    q: string;
    qImage?: string;           // Optional question image URL
    options: string[];
    optionImages?: string[];   // Optional image URLs for options
    correctIndex: number;
    explanation?: string;
    explanationImage?: string; // Optional explanation image URL
};

type PYQPaperDoc = {
    id: string;
    exam: string;
    year: number;
    title: string;
    questions: Question[];
};

const nodesCol = collection(db, 'nodes');

function makeQuestionId(): string {
    return typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `q_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function makeEmptyQuestion(): Question {
    return {
        id: makeQuestionId(),
        q: '',
        qImage: '',
        options: ['', '', '', ''],
        optionImages: ['', '', '', ''],
        correctIndex: 0,
        explanation: '',
        explanationImage: '',
    };
}

export default function PYQMCQ() {
    const [papers, setPapers] = useState<PYQPaperDoc[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [currentId, setCurrentId] = useState<string | null>(null);
    const [current, setCurrent] = useState<PYQPaperDoc | null>(null);

    const [importingExcel, setImportingExcel] = useState(false);
    const [importMessage, setImportMessage] = useState<string>('');

    /** 🔑 Remember original exam+year of selected paper so we can detect if user changed it */
    const [originalKey, setOriginalKey] = useState<string | null>(null);
    const makeKey = (exam: string, year: number) => `${exam}::${year}`;

    // ───────────────── Load all PYQ MCQ papers ─────────────────
    const loadPapers = async () => {
        try {
            setLoading(true);
            setError(null);

            const qy = query(
                nodesCol,
                where('type', '==', 'pyq_mcq'),
                orderBy('year', 'desc'),
            );

            const snap = await getDocs(qy);

            const list: PYQPaperDoc[] = snap.docs.map(d => {
                const data = d.data() as any;
                const rawQs: any[] = Array.isArray(data.questions)
                    ? data.questions
                    : [];

                const questions: Question[] = rawQs.map((q: any, idx: number) => ({
                    id: q.id || `${d.id}_${idx}`,
                    q: q.q ?? '',
                    qImage: q.qImage ?? '',
                    options: Array.isArray(q.options)
                        ? q.options
                        : ['', '', '', ''],
                    optionImages: Array.isArray(q.optionImages)
                        ? q.optionImages
                        : ['', '', '', ''],
                    correctIndex:
                        typeof q.correctIndex === 'number' ? q.correctIndex : 0,
                    explanation: q.explanation ?? '',
                    explanationImage: q.explanationImage ?? '',
                }));

                return {
                    id: d.id,
                    exam: data.exam ?? 'NEET',
                    year: Number(data.year) || 0,
                    title:
                        data.title ??
                        `${data.exam ?? 'NEET'} ${data.year ?? ''} – Full Exam`,
                    questions,
                };
            });

            setPapers(list);

            // auto-select first paper only ONCE (initial mount)
            if (!currentId && list.length > 0) {
                setCurrentId(list[0].id);
                setCurrent(list[0]);
                setOriginalKey(makeKey(list[0].exam, list[0].year));
                setImportMessage('');
            }
        } catch (e: any) {
            console.error('[PYQMcqAdmin] load error', e);
            setError('Failed to load PYQ MCQ papers from Firestore.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadPapers();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ───────────────── Select paper ─────────────────
    const handleSelectPaper = (id: string) => {
        const found = papers.find(p => p.id === id) || null;
        setCurrentId(id);
        setCurrent(found);
        setImportMessage('');

        if (found) {
            setOriginalKey(makeKey(found.exam, found.year));
        } else {
            setOriginalKey(null);
        }
    };

    // ───────────────── Create new year set ─────────────────
    const handleNewPaper = () => {
        const year = new Date().getFullYear();

        const fresh: PYQPaperDoc = {
            id: '_new_',
            exam: 'NEET',
            year,
            title: `NEET ${year} – Full Exam`,
            questions: [makeEmptyQuestion()],
        };

        setCurrentId('_new_');
        setCurrent(fresh);
        setImportMessage('');
        setOriginalKey(null); // brand-new, nothing persisted yet
    };

    // ───────────────── Update meta fields ─────────────────
    const updateCurrent = <K extends keyof PYQPaperDoc>(
        key: K,
        value: PYQPaperDoc[K],
    ) => {
        setCurrent(prev => (prev ? { ...prev, [key]: value } : prev));
    };

    // ───────────────── Question operations ─────────────────
    const handleAddQuestion = () => {
        setCurrent(prev =>
            prev
                ? {
                    ...prev,
                    questions: [...prev.questions, makeEmptyQuestion()],
                }
                : prev,
        );
    };

    const handleDeleteQuestion = (qid: string) => {
        setCurrent(prev =>
            prev
                ? {
                    ...prev,
                    questions: prev.questions.filter(q => q.id !== qid),
                }
                : prev,
        );
    };

    const handleUpdateQuestionField = (
        qid: string,
        field: keyof Question,
        value: any,
    ) => {
        setCurrent(prev =>
            prev
                ? {
                    ...prev,
                    questions: prev.questions.map(q =>
                        q.id === qid ? { ...q, [field]: value } : q,
                    ),
                }
                : prev,
        );
    };

    const handleUpdateOption = (
        qid: string,
        optIndex: number,
        value: string,
    ) => {
        setCurrent(prev =>
            prev
                ? {
                    ...prev,
                    questions: prev.questions.map(q => {
                        if (q.id !== qid) return q;
                        const copy = [...q.options];
                        copy[optIndex] = value;
                        return { ...q, options: copy };
                    }),
                }
                : prev,
        );
    };

    const handleUpdateOptionImage = (
        qid: string,
        optIndex: number,
        value: string,
    ) => {
        setCurrent(prev =>
            prev
                ? {
                    ...prev,
                    questions: prev.questions.map(q => {
                        if (q.id !== qid) return q;
                        const copy = [...(q.optionImages || ['', '', '', ''])];
                        copy[optIndex] = value;
                        return { ...q, optionImages: copy };
                    }),
                }
                : prev,
        );
    };

    // Helper to safely read a cell using multiple possible column names
    const getCell = (row: any, keys: string[]): string => {
        for (const k of keys) {
            if (row[k] !== undefined && row[k] !== null) {
                const v = String(row[k]).trim();
                if (v !== '') return v;
            }
        }
        return '';
    };

    // ───────────────── Bulk import from Excel ─────────────────
    const handleExcelImport = async (
        e: React.ChangeEvent<HTMLInputElement>,
    ) => {
        const file = e.target.files?.[0];
        e.target.value = ''; // reset so same file can be chosen again

        if (!file) return;
        if (!current) {
            alert('Please create or select a paper first (Exam + Year).');
            return;
        }

        try {
            setImportingExcel(true);
            setImportMessage('Reading Excel file…');

            const buffer = await file.arrayBuffer();
            const workbook = XLSX.read(buffer, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];

            const rows: any[] = XLSX.utils.sheet_to_json(sheet, {
                defval: '',
            });

            if (!rows.length) {
                setImportMessage('No rows found in Excel sheet.');
                return;
            }

            const imported: Question[] = [];

            rows.forEach(row => {
                // Question text
                const questionText = getCell(row, ['Question', 'Q', 'question']);
                if (!questionText) return;

                // Options – support multiple header patterns
                const optA = getCell(row, ['OptionA', 'A', '1', 'Option 1']);
                const optB = getCell(row, ['OptionB', 'B', '2', 'Option 2']);
                const optC = getCell(row, ['OptionC', 'C', '3', 'Option 3']);
                const optD = getCell(row, ['OptionD', 'D', '4', 'Option 4']);

                const options = [optA, optB, optC, optD];

                // Determine correct index
                let correctIndex = 0; // default 0 (Option A)

                // 1️⃣ Try numeric index columns
                const rawIndexStr = getCell(row, [
                    'CorrectIndex',
                    'Index',
                    'AnsIndex',
                    'AnswerIndex',
                ]);

                if (rawIndexStr) {
                    let ci = Number(rawIndexStr);
                    if (!Number.isFinite(ci) || !ci) ci = 1;
                    correctIndex = Math.min(3, Math.max(0, ci - 1)); // 1-based → 0-based
                } else {
                    // 2️⃣ Try letter or text answer
                    const rawAnswer = getCell(row, [
                        'CorrectOption',
                        'Correct',
                        'Answer',
                        'Ans',
                    ]);

                    if (rawAnswer) {
                        const upper = rawAnswer.toUpperCase();

                        // If it's a letter A-D
                        const letterMap: Record<string, number> = {
                            A: 0,
                            B: 1,
                            C: 2,
                            D: 3,
                        };

                        if (letterMap[upper] !== undefined) {
                            correctIndex = letterMap[upper];
                        } else {
                            // Otherwise try to match full text with one of the options
                            const idxOpt = options.findIndex(
                                o =>
                                    o.trim().toLowerCase() ===
                                    rawAnswer.trim().toLowerCase(),
                            );
                            if (idxOpt >= 0) {
                                correctIndex = idxOpt;
                            } else {
                                correctIndex = 0;
                            }
                        }
                    }
                }

                const explanation = getCell(row, [
                    'Explanation',
                    'Explain',
                    'Reason',
                    'Solution',
                ]);

                // Image fields from Excel
                const qImage = getCell(row, ['QuestionImage', 'QImage', 'qImage']);
                const optionAImage = getCell(row, ['OptionAImage', 'Option1Image', 'OptAImg']);
                const optionBImage = getCell(row, ['OptionBImage', 'Option2Image', 'OptBImg']);
                const optionCImage = getCell(row, ['OptionCImage', 'Option3Image', 'OptCImg']);
                const optionDImage = getCell(row, ['OptionDImage', 'Option4Image', 'OptDImg']);
                const explanationImage = getCell(row, ['ExplanationImage', 'ExplainImage', 'SolutionImage']);

                imported.push({
                    id: makeQuestionId(),
                    q: questionText,
                    qImage,
                    options,
                    optionImages: [optionAImage, optionBImage, optionCImage, optionDImage],
                    correctIndex,
                    explanation,
                    explanationImage,
                });
            });

            if (!imported.length) {
                setImportMessage(
                    'No valid questions found. Make sure columns are: Question, OptionA/OptionB/OptionC/OptionD (or A/B/C/D), CorrectIndex/CorrectOption/Answer, Explanation',
                );
                return;
            }

            // ✅ APPEND to existing questions instead of replacing
            setCurrent(prev => {
                if (!prev) return prev;

                // Remove empty placeholder questions (where q is empty)
                const existing = prev.questions.filter(
                    q => q.q && q.q.trim() !== '',
                );

                return {
                    ...prev,
                    questions: [...existing, ...imported],
                };
            });

            setImportMessage(
                `Imported ${imported.length} questions from ${file.name}. They were appended to existing questions. Remember to click "Save".`,
            );
        } catch (err: any) {
            console.error('[PYQMcqAdmin] Excel import error', err);
            setImportMessage(
                `❌ Failed to import: ${err?.message || String(err)}`,
            );
        } finally {
            setImportingExcel(false);
        }
    };

    // ───────────────── Save (create/update) ─────────────────
    const handleSave = async () => {
        if (!current) return;

        if (!current.year || !current.exam) {
            alert('Please enter exam name and year.');
            return;
        }

        if (!current.questions.length) {
            const ok = window.confirm(
                'This set has 0 questions. Do you still want to save it?',
            );
            if (!ok) return;
        }

        try {
            setSaving(true);
            setError(null);

            // normalize current questions - only include image fields if they have actual values
            const normalizedCurrent: Question[] = current.questions.map(q => {
                const base: Question = {
                    id: q.id || makeQuestionId(),
                    q: q.q,
                    options: q.options && q.options.length ? q.options : ['', '', '', ''],
                    correctIndex:
                        typeof q.correctIndex === 'number' &&
                            q.correctIndex >= 0 &&
                            q.correctIndex < 4
                            ? q.correctIndex
                            : 0,
                    explanation: q.explanation ?? '',
                };

                // Only include qImage if it has a non-empty value
                if (q.qImage && q.qImage.trim()) {
                    base.qImage = q.qImage.trim();
                }

                // Only include optionImages if at least one option has an image
                const optImgs = q.optionImages || ['', '', '', ''];
                const hasAnyOptionImage = optImgs.some(img => img && img.trim());
                if (hasAnyOptionImage) {
                    // Keep the array structure, trim values
                    base.optionImages = optImgs.map(img => (img || '').trim());
                }

                // Only include explanationImage if it has a non-empty value
                if (q.explanationImage && q.explanationImage.trim()) {
                    base.explanationImage = q.explanationImage.trim();
                }

                return base;
            });

            const basePayload = {
                type: 'pyq_mcq',
                exam: current.exam,
                year: current.year,
                title: current.title,
            };

            const keyNow = makeKey(current.exam, current.year);
            const isNew = current.id === '_new_';
            const examYearChanged =
                !isNew && originalKey !== null && originalKey !== keyNow;

            if (isNew || examYearChanged) {
                // 🆕 Create a completely NEW document
                if (examYearChanged && !isNew) {
                    const ok = window.confirm(
                        'You changed Exam/Year of an existing paper.\n\nDo you want to create a NEW paper and keep the old one as it is?',
                    );
                    if (!ok) {
                        setSaving(false);
                        return;
                    }
                }

                const newDocRef = await addDoc(nodesCol, {
                    ...basePayload,
                    questions: normalizedCurrent,
                });

                // After creating new, reload list and select the new one
                await loadPapers();
                setCurrentId(newDocRef.id);
                setCurrent({
                    ...current,
                    id: newDocRef.id,
                    questions: normalizedCurrent,
                });
                setOriginalKey(keyNow);
            } else {
                // ✏️ Update existing document (same exam+year)
                const ref = doc(nodesCol, current.id);
                // we don't need old questions anymore, because current already has full list
                await updateDoc(ref, {
                    ...basePayload,
                    questions: normalizedCurrent,
                });

                await loadPapers();
                setOriginalKey(keyNow);
            }

            alert('Saved successfully.');
        } catch (e: any) {
            console.error('[PYQMcqAdmin] save error', e);
            setError('Failed to save. Check console for details.');
        } finally {
            setSaving(false);
        }
    };

    // ───────────────── Delete entire year set ─────────────────
    const handleDeletePaper = async () => {
        if (!current || current.id === '_new_') return;

        const ok = window.confirm(
            `Delete ${current.exam} ${current.year} paper and all its questions?`,
        );
        if (!ok) return;

        try {
            setSaving(true);
            setError(null);

            const ref = doc(nodesCol, current.id);
            await deleteDoc(ref);

            setCurrent(null);
            setCurrentId(null);
            setOriginalKey(null);
            await loadPapers();
        } catch (e: any) {
            console.error('[PYQMcqAdmin] delete error', e);
            setError('Failed to delete paper.');
        } finally {
            setSaving(false);
        }
    };

    // ───────────────── UI ─────────────────
    return (
        <div
            style={{
                display: 'flex',
                height: '100vh',
                fontFamily:
                    'system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
                background: '#0b1120',
                color: '#e5e7eb',
            }}
        >
            {/* LEFT: list of years */}
            <div
                style={{
                    width: 260,
                    borderRight: '1px solid #1f2937',
                    padding: '16px',
                    boxSizing: 'border-box',
                    background: '#020617',
                }}
            >
                <h2 style={{ fontSize: 18, marginBottom: 8 }}>PYQ MCQ Admin</h2>
                <p
                    style={{
                        fontSize: 12,
                        color: '#9ca3af',
                        marginBottom: 12,
                    }}
                >
                    Manage NEET previous year MCQ sets by year.
                </p>

                <button
                    onClick={handleNewPaper}
                    style={{
                        width: '100%',
                        padding: '8px 10px',
                        borderRadius: 999,
                        border: 'none',
                        cursor: 'pointer',
                        background: '#22c55e',
                        color: '#022c22',
                        fontWeight: 600,
                        fontSize: 13,
                        marginBottom: 10,
                    }}
                >
                    + New Year Set
                </button>

                {loading && (
                    <p style={{ fontSize: 12, color: '#9ca3af' }}>Loading…</p>
                )}

                {error && (
                    <p style={{ fontSize: 12, color: '#f97373' }}>{error}</p>
                )}

                <div
                    style={{
                        marginTop: 8,
                        borderTop: '1px solid #1f2937',
                        paddingTop: 8,
                        overflowY: 'auto',
                        maxHeight: 'calc(100vh - 170px)',
                    }}
                >
                    {papers.length === 0 ? (
                        <p style={{ fontSize: 12, color: '#9ca3af' }}>
                            No PYQ MCQ sets yet.
                        </p>
                    ) : (
                        papers.map(p => (
                            <div
                                key={p.id}
                                onClick={() => handleSelectPaper(p.id)}
                                style={{
                                    padding: '8px 10px',
                                    borderRadius: 10,
                                    marginBottom: 6,
                                    cursor: 'pointer',
                                    background:
                                        currentId === p.id
                                            ? '#1e293b'
                                            : 'transparent',
                                    border:
                                        currentId === p.id
                                            ? '1px solid #38bdf8'
                                            : '1px solid transparent',
                                }}
                            >
                                <div
                                    style={{
                                        fontSize: 13,
                                        fontWeight: 600,
                                        color: '#e5e7eb',
                                    }}
                                >
                                    {p.exam} {p.year}
                                </div>
                                <div
                                    style={{
                                        fontSize: 11,
                                        color: '#9ca3af',
                                    }}
                                >
                                    {p.questions.length} questions
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* RIGHT: editor */}
            <div
                style={{
                    flex: 1,
                    padding: '16px 20px',
                    boxSizing: 'border-box',
                    overflowY: 'auto',
                }}
            >
                {!current ? (
                    <div
                        style={{
                            marginTop: 40,
                            textAlign: 'center',
                            color: '#9ca3af',
                            fontSize: 14,
                        }}
                    >
                        Select a year from the left, or create a new set.
                    </div>
                ) : (
                    <>
                        {/* Meta section */}
                        <div
                            style={{
                                display: 'flex',
                                gap: 12,
                                marginBottom: 16,
                                alignItems: 'flex-end',
                            }}
                        >
                            <div>
                                <label
                                    style={{
                                        fontSize: 12,
                                        color: '#9ca3af',
                                        display: 'block',
                                        marginBottom: 4,
                                    }}
                                >
                                    Exam
                                </label>
                                <input
                                    value={current.exam}
                                    onChange={e =>
                                        updateCurrent('exam', e.target.value)
                                    }
                                    style={{
                                        padding: '6px 8px',
                                        borderRadius: 8,
                                        border: '1px solid #1f2937',
                                        background: '#020617',
                                        color: '#e5e7eb',
                                        fontSize: 13,
                                        minWidth: 120,
                                    }}
                                />
                            </div>

                            <div>
                                <label
                                    style={{
                                        fontSize: 12,
                                        color: '#9ca3af',
                                        display: 'block',
                                        marginBottom: 4,
                                    }}
                                >
                                    Year
                                </label>
                                <input
                                    type="number"
                                    value={current.year}
                                    onChange={e =>
                                        updateCurrent(
                                            'year',
                                            Number(e.target.value) || 0,
                                        )
                                    }
                                    style={{
                                        padding: '6px 8px',
                                        borderRadius: 8,
                                        border: '1px solid #1f2937',
                                        background: '#020617',
                                        color: '#e5e7eb',
                                        fontSize: 13,
                                        width: 100,
                                    }}
                                />
                            </div>

                            <div style={{ flex: 1 }}>
                                <label
                                    style={{
                                        fontSize: 12,
                                        color: '#9ca3af',
                                        display: 'block',
                                        marginBottom: 4,
                                    }}
                                >
                                    Title (optional)
                                </label>
                                <input
                                    value={current.title}
                                    onChange={e =>
                                        updateCurrent('title', e.target.value)
                                    }
                                    style={{
                                        padding: '6px 8px',
                                        borderRadius: 8,
                                        border: '1px solid #1f2937',
                                        background: '#020617',
                                        color: '#e5e7eb',
                                        fontSize: 13,
                                        width: '100%',
                                    }}
                                />
                            </div>

                            <div style={{ display: 'flex', gap: 8 }}>
                                <button
                                    onClick={handleSave}
                                    disabled={saving}
                                    style={{
                                        padding: '8px 12px',
                                        borderRadius: 999,
                                        border: 'none',
                                        cursor: 'pointer',
                                        background: '#38bdf8',
                                        color: '#0f172a',
                                        fontWeight: 600,
                                        fontSize: 13,
                                        opacity: saving ? 0.7 : 1,
                                    }}
                                >
                                    {saving ? 'Saving…' : 'Save'}
                                </button>

                                {current.id !== '_new_' && (
                                    <button
                                        onClick={handleDeletePaper}
                                        disabled={saving}
                                        style={{
                                            padding: '8px 12px',
                                            borderRadius: 999,
                                            border: '1px solid #f97373',
                                            cursor: 'pointer',
                                            background: 'transparent',
                                            color: '#fca5a5',
                                            fontWeight: 600,
                                            fontSize: 13,
                                        }}
                                    >
                                        Delete
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Questions header + bulk import */}
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: 8,
                                gap: 12,
                            }}
                        >
                            <div>
                                <h3 style={{ fontSize: 16, margin: 0 }}>
                                    Questions ({current.questions.length})
                                </h3>
                                <p
                                    style={{
                                        fontSize: 11,
                                        color: '#9ca3af',
                                        marginTop: 2,
                                    }}
                                >
                                    Each question should have 4 options. Choose the
                                    correct one with the radio button. Explanation is
                                    shown in the app when students review.
                                </p>
                            </div>

                            <div
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'flex-end',
                                    gap: 6,
                                }}
                            >
                                <div style={{ display: 'flex', gap: 8 }}>
                                    <button
                                        onClick={handleAddQuestion}
                                        style={{
                                            padding: '6px 10px',
                                            borderRadius: 999,
                                            border: 'none',
                                            cursor: 'pointer',
                                            background: '#22c55e',
                                            color: '#022c22',
                                            fontWeight: 600,
                                            fontSize: 12,
                                        }}
                                    >
                                        + Add Question
                                    </button>

                                    {/* Bulk import button + hidden input */}
                                    <label
                                        style={{
                                            padding: '6px 10px',
                                            borderRadius: 999,
                                            border: '1px solid #38bdf8',
                                            cursor: 'pointer',
                                            background: 'transparent',
                                            color: '#7dd3fc',
                                            fontWeight: 600,
                                            fontSize: 12,
                                        }}
                                    >
                                        {importingExcel
                                            ? 'Importing…'
                                            : 'Import Excel'}
                                        <input
                                            type="file"
                                            accept=".xlsx,.xls"
                                            onChange={handleExcelImport}
                                            style={{ display: 'none' }}
                                            disabled={importingExcel}
                                        />
                                    </label>
                                </div>
                                <span
                                    style={{
                                        fontSize: 10,
                                        color: '#9ca3af',
                                        maxWidth: 400,
                                        textAlign: 'right',
                                    }}
                                >
                                    Excel columns: Question, OptionA-D, CorrectIndex (1-4),
                                    Explanation, QuestionImage, OptionAImage-DImage, ExplanationImage
                                </span>
                                {importMessage && (
                                    <span
                                        style={{
                                            fontSize: 11,
                                            color: '#a5b4fc',
                                            textAlign: 'right',
                                        }}
                                    >
                                        {importMessage}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Questions list (manual editor) */}
                        <div
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 10,
                            }}
                        >
                            {current.questions.map((q, idx) => (
                                <div
                                    key={q.id}
                                    style={{
                                        borderRadius: 10,
                                        border: '1px solid #1f2937',
                                        padding: '10px 12px',
                                        background: '#020617',
                                    }}
                                >
                                    <div
                                        style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            marginBottom: 6,
                                        }}
                                    >
                                        <span
                                            style={{
                                                fontSize: 12,
                                                color: '#9ca3af',
                                            }}
                                        >
                                            Q{idx + 1}
                                        </span>
                                        <button
                                            onClick={() =>
                                                handleDeleteQuestion(q.id)
                                            }
                                            style={{
                                                border: 'none',
                                                background: 'transparent',
                                                cursor: 'pointer',
                                                fontSize: 11,
                                                color: '#fca5a5',
                                            }}
                                        >
                                            Delete
                                        </button>
                                    </div>

                                    {/* SECTION 1: Question Text */}
                                    <div style={{
                                        marginBottom: 12,
                                        padding: 10,
                                        background: '#0f172a',
                                        borderRadius: 8,
                                    }}>
                                        <label style={{ fontSize: 11, color: '#60a5fa', display: 'block', marginBottom: 4, fontWeight: 600 }}>
                                            Question Text
                                        </label>
                                        <textarea
                                            value={q.q}
                                            onChange={e =>
                                                handleUpdateQuestionField(q.id, 'q', e.target.value)
                                            }
                                            placeholder="Enter the question text here..."
                                            rows={2}
                                            style={{
                                                width: '100%',
                                                borderRadius: 6,
                                                border: '1px solid #1f2937',
                                                background: '#020617',
                                                color: '#e5e7eb',
                                                fontSize: 13,
                                                padding: '8px 10px',
                                                resize: 'vertical',
                                            }}
                                        />

                                        {/* Question Image */}
                                        <div style={{ marginTop: 8 }}>
                                            <ImageUploader
                                                label="Question Image (optional - add diagram/figure for the question)"
                                                value={q.qImage || ''}
                                                onChange={(url) =>
                                                    handleUpdateQuestionField(q.id, 'qImage', url)
                                                }
                                                folder="questions"
                                            />
                                        </div>
                                    </div>

                                    {/* SECTION 2: Answer Options */}
                                    <div style={{
                                        marginBottom: 12,
                                        padding: 10,
                                        background: '#0f172a',
                                        borderRadius: 8,
                                    }}>
                                        <label style={{ fontSize: 11, color: '#22c55e', display: 'block', marginBottom: 8, fontWeight: 600 }}>
                                            Answer Options (select the correct one with radio button)
                                        </label>

                                        {/* Text Options */}
                                        <div style={{ marginBottom: 10 }}>
                                            <span style={{ fontSize: 10, color: '#9ca3af', display: 'block', marginBottom: 6 }}>
                                                Text Options (enter option text like "m/s", "kg", etc.)
                                            </span>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                                                {q.options.map((opt, i) => (
                                                    <label
                                                        key={i}
                                                        style={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: 8,
                                                            padding: '6px 8px',
                                                            background: q.correctIndex === i ? '#14532d' : '#020617',
                                                            borderRadius: 6,
                                                            border: q.correctIndex === i ? '1px solid #22c55e' : '1px solid #1f2937',
                                                        }}
                                                    >
                                                        <input
                                                            type="radio"
                                                            name={`correct_${q.id}`}
                                                            checked={q.correctIndex === i}
                                                            onChange={() =>
                                                                handleUpdateQuestionField(q.id, 'correctIndex', i)
                                                            }
                                                            style={{ accentColor: '#22c55e' }}
                                                        />
                                                        <span style={{ color: '#9ca3af', fontSize: 11, minWidth: 20 }}>
                                                            {String.fromCharCode(65 + i)}.
                                                        </span>
                                                        <input
                                                            value={opt}
                                                            onChange={e =>
                                                                handleUpdateOption(q.id, i, e.target.value)
                                                            }
                                                            placeholder={`Option ${String.fromCharCode(65 + i)} text`}
                                                            style={{
                                                                flex: 1,
                                                                padding: '4px 8px',
                                                                borderRadius: 4,
                                                                border: 'none',
                                                                background: 'transparent',
                                                                color: '#e5e7eb',
                                                                fontSize: 12,
                                                            }}
                                                        />
                                                    </label>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Image Options (collapsible) */}
                                        <details style={{ marginTop: 8 }}>
                                            <summary style={{
                                                fontSize: 10,
                                                color: '#f59e0b',
                                                cursor: 'pointer',
                                                padding: '6px 10px',
                                                background: '#1c1917',
                                                borderRadius: 6,
                                                border: '1px dashed #78350f',
                                            }}>
                                                Image Options (only if answers are images instead of text)
                                            </summary>
                                            <div style={{
                                                marginTop: 8,
                                                padding: 10,
                                                background: '#1c1917',
                                                borderRadius: 6,
                                                border: '1px solid #78350f',
                                            }}>
                                                <p style={{ fontSize: 10, color: '#fbbf24', marginBottom: 8 }}>
                                                    Use this section ONLY when answer choices are images (diagrams, graphs, etc.) instead of text.
                                                </p>
                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                                                    {[0, 1, 2, 3].map((i) => (
                                                        <div key={i} style={{
                                                            padding: 8,
                                                            background: '#020617',
                                                            borderRadius: 6,
                                                            border: q.correctIndex === i ? '2px solid #22c55e' : '1px solid #374151',
                                                        }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                                                                <input
                                                                    type="radio"
                                                                    name={`correct_img_${q.id}`}
                                                                    checked={q.correctIndex === i}
                                                                    onChange={() =>
                                                                        handleUpdateQuestionField(q.id, 'correctIndex', i)
                                                                    }
                                                                    style={{ accentColor: '#22c55e' }}
                                                                />
                                                                <span style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600 }}>
                                                                    Option {String.fromCharCode(65 + i)}
                                                                </span>
                                                                {q.correctIndex === i && (
                                                                    <span style={{ fontSize: 9, color: '#22c55e', marginLeft: 'auto' }}>CORRECT</span>
                                                                )}
                                                            </div>
                                                            <ImageUploader
                                                                value={(q.optionImages || [])[i] || ''}
                                                                onChange={(url) =>
                                                                    handleUpdateOptionImage(q.id, i, url)
                                                                }
                                                                folder="questions/options"
                                                                placeholder="Paste image URL or upload..."
                                                            />
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </details>
                                    </div>

                                    {/* SECTION 3: Explanation */}
                                    <div style={{
                                        padding: 10,
                                        background: '#0f172a',
                                        borderRadius: 8,
                                    }}>
                                        <label style={{ fontSize: 11, color: '#a78bfa', display: 'block', marginBottom: 4, fontWeight: 600 }}>
                                            Explanation (shown after wrong answer)
                                        </label>
                                        <textarea
                                            value={q.explanation || ''}
                                            onChange={e =>
                                                handleUpdateQuestionField(q.id, 'explanation', e.target.value)
                                            }
                                            placeholder="Explain why the correct option is right..."
                                            rows={2}
                                            style={{
                                                width: '100%',
                                                borderRadius: 6,
                                                border: '1px solid #1f2937',
                                                background: '#020617',
                                                color: '#e5e7eb',
                                                fontSize: 12,
                                                padding: '8px 10px',
                                                resize: 'vertical',
                                            }}
                                        />

                                        {/* Explanation Image */}
                                        <div style={{ marginTop: 8 }}>
                                            <ImageUploader
                                                label="Explanation Image (optional - add solution diagram)"
                                                value={q.explanationImage || ''}
                                                onChange={(url) =>
                                                    handleUpdateQuestionField(q.id, 'explanationImage', url)
                                                }
                                                folder="questions/explanations"
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
