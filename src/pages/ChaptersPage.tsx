// import React, { useEffect, useState } from 'react';
// import { db } from '../firebase';
// import {
//     addDoc,
//     collection,
//     deleteDoc,
//     doc,
//     getDocs,
//     orderBy,
//     query,
//     serverTimestamp,
//     updateDoc,
//     where,
// } from 'firebase/firestore';
// import type {
//     SubjectDoc,
//     UnitDoc,
//     ChapterDoc,
//     Video,
//     Pdf,
//     Question,
// } from '../types';

// const col = collection(db, 'nodes');

// export default function ChaptersPage() {
//     const [subjects, setSubjects] = useState<SubjectDoc[]>([]);
//     const [units, setUnits] = useState<UnitDoc[]>([]);
//     const [chapters, setChapters] = useState<ChapterDoc[]>([]);

//     const [subjectId, setSubjectId] = useState('');
//     const [unitId, setUnitId] = useState('');
//     const [name, setName] = useState('');
//     const [order, setOrder] = useState(1);

//     // temp editors
//     const [videos, setVideos] = useState<Video[]>([]);
//     const [pdfs, setPdfs] = useState<Pdf[]>([]);
//     const [questions, setQuestions] = useState<Question[]>([]);

//     // ------------ LOADERS (subjects, units, chapters) ------------

//     const loadSubjects = async () => {
//         const q = query(
//             col,
//             where('type', '==', 'subject'),
//             orderBy('order', 'asc'),
//         );
//         const snap = await getDocs(q);
//         const list = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })) as SubjectDoc[];
//         setSubjects(list);

//         if (!subjectId && list[0]?.id) {
//             setSubjectId(list[0].id);
//         }
//     };

//     const loadUnits = async (forSubjectId?: string) => {
//         const sid = forSubjectId ?? subjectId;
//         if (!sid) {
//             setUnits([]);
//             setUnitId('');
//             return;
//         }

//         const q = query(
//             col,
//             where('type', '==', 'unit'),
//             where('parentId', '==', sid), // unit belongs to subject
//             orderBy('order', 'asc'),
//         );
//         const snap = await getDocs(q);
//         const list = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })) as UnitDoc[];
//         setUnits(list);

//         // auto-select first unit for this subject
//         if (list[0]?.id) {
//             setUnitId(list[0].id);
//         } else {
//             setUnitId('');
//             setChapters([]);
//             setOrder(1);
//         }
//     };

//     const loadChapters = async (forUnitId?: string) => {
//         const uid = forUnitId ?? unitId;
//         if (!uid) {
//             setChapters([]);
//             setOrder(1);
//             return;
//         }

//         const q = query(
//             col,
//             where('type', '==', 'chapter'),
//             where('parentId', '==', uid), // chapter belongs to unit
//             orderBy('order', 'asc'),
//         );
//         const snap = await getDocs(q);
//         const list = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })) as ChapterDoc[];
//         setChapters(list);

//         // update default order based on count
//         if (list.length === 0) setOrder(1);
//         else setOrder(list.length + 1);
//     };

//     useEffect(() => {
//         loadSubjects();
//     }, []);

//     useEffect(() => {
//         if (subjectId) {
//             loadUnits(subjectId);
//         } else {
//             setUnits([]);
//             setUnitId('');
//             setChapters([]);
//             setOrder(1);
//         }
//         // reset editors when subject changes
//         setName('');
//         setVideos([]);
//         setPdfs([]);
//         setQuestions([]);
//     }, [subjectId]);

//     useEffect(() => {
//         if (unitId) {
//             loadChapters(unitId);
//         } else {
//             setChapters([]);
//             setOrder(1);
//         }
//         // reset chapter form when unit changes
//         setName('');
//         setVideos([]);
//         setPdfs([]);
//         setQuestions([]);
//     }, [unitId]);

//     // ------------ CRUD HELPERS FOR CHAPTERS ------------

//     const addChapter = async () => {
//         if (!subjectId || !unitId || !name.trim()) return;

//         const chapterData: Partial<ChapterDoc> = {
//             type: 'chapter',
//             // 🔗 tree linking
//             parentId: unitId,   // immediate parent
//             subjectId,          // ancestor subject
//             unitId,             // explicit unit
//             name: name.trim(),
//             order: Number(order) || 0,
//             videos,
//             pdfs,
//             questions,          // ✅ includes explanation field now
//             createdAt: serverTimestamp(),
//         } as any;

//         await addDoc(col, chapterData);

//         // reset form
//         setName('');
//         setVideos([]);
//         setPdfs([]);
//         setQuestions([]);

//         await loadChapters(unitId);
//     };

//     const patchChapter = async (id: string, patch: Partial<ChapterDoc>) => {
//         await updateDoc(doc(db, 'nodes', id), patch as any);
//         await loadChapters();
//     };

//     const removeChapter = async (id: string) => {
//         if (!window.confirm('Delete this chapter?')) return;
//         await deleteDoc(doc(db, 'nodes', id));
//         await loadChapters();
//     };

//     // ------------ SMALL EDITOR FOR VIDEOS/PDFS ------------

//     const MutList = <T extends { id: string }>({
//         items,
//         setItems,
//         labels,
//     }: {
//         items: T[];
//         setItems: (x: T[]) => void;
//         labels: [string, string];
//     }) => (
//         <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
//             {items.map((it: any, idx) => (
//                 <div
//                     key={it.id}
//                     style={{ display: 'grid', gridTemplateColumns: '1fr 2fr auto', gap: 6 }}
//                 >
//                     <input
//                         placeholder={labels[0]}
//                         value={it.title || it.q || ''}
//                         onChange={e => {
//                             const arr = [...items] as any;
//                             if (arr[idx].title !== undefined) arr[idx].title = e.target.value;
//                             else arr[idx].q = e.target.value;
//                             setItems(arr);
//                         }}
//                     />
//                     <input
//                         placeholder={labels[1]}
//                         value={it.url ?? (it.options?.join('|') ?? '')}
//                         onChange={e => {
//                             const arr = [...items] as any;
//                             if (arr[idx].url !== undefined) arr[idx].url = e.target.value;
//                             else arr[idx].options = e.target.value.split('|');
//                             setItems(arr);
//                         }}
//                     />
//                     <button
//                         onClick={() => {
//                             const arr = [...items];
//                             arr.splice(idx, 1);
//                             setItems(arr);
//                         }}
//                     >
//                         ✕
//                     </button>
//                 </div>
//             ))}
//         </div>
//     );

//     // helpers to add new rows
//     const addVideo = () =>
//         setVideos(v => [...v, { id: crypto.randomUUID(), title: '', url: '' } as Video]);

//     const addPdf = () =>
//         setPdfs(p => [...p, { id: crypto.randomUUID(), title: '', url: '' } as Pdf]);

//     const addQ = () =>
//         setQuestions(q => [
//             ...q,
//             {
//                 id: crypto.randomUUID(),
//                 q: '',
//                 options: ['', '', ''],
//                 correctIndex: 0,
//                 explanation: '',            // ✅ new field default
//             } as Question,
//         ]);

//     // ------------ RENDER ------------

//     return (
//         <div style={{ padding: 16 }}>
//             <h2>Chapters & Content</h2>

//             {/* Subject + Unit selectors */}
//             <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
//                 <label>Subject</label>
//                 <select
//                     value={subjectId}
//                     onChange={e => setSubjectId(e.target.value)}
//                 >
//                     {subjects.map(s => (
//                         <option key={s.id} value={s.id}>
//                             {s.name}
//                         </option>
//                     ))}
//                     {subjects.length === 0 && <option>No subjects</option>}
//                 </select>

//                 <label>Unit</label>
//                 <select
//                     value={unitId}
//                     onChange={e => setUnitId(e.target.value)}
//                 >
//                     {units.map(u => (
//                         <option key={u.id} value={u.id}>
//                             {u.name}
//                         </option>
//                     ))}
//                     {units.length === 0 && <option>No units</option>}
//                 </select>
//             </div>

//             {/* Chapter basic info */}
//             <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
//                 <input
//                     placeholder="Chapter name"
//                     value={name}
//                     onChange={e => setName(e.target.value)}
//                 />
//                 <input
//                     type="number"
//                     placeholder="Order"
//                     value={order}
//                     onChange={e => setOrder(Number(e.target.value))}
//                     style={{ width: 100 }}
//                 />
//             </div>

//             {/* Content editors */}
//             <div
//                 style={{
//                     display: 'grid',
//                     gridTemplateColumns: '1fr 1fr',
//                     gap: 16,
//                     marginBottom: 16,
//                 }}
//             >
//                 {/* Videos */}
//                 <div>
//                     <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
//                         <h4>Videos</h4>
//                         <button onClick={addVideo}>+ Add</button>
//                     </div>
//                     {MutList({ items: videos, setItems: setVideos, labels: ['Title', 'URL'] })}
//                 </div>

//                 {/* PDFs */}
//                 <div>
//                     <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
//                         <h4>PDFs</h4>
//                         <button onClick={addPdf}>+ Add</button>
//                     </div>
//                     {MutList({ items: pdfs, setItems: setPdfs, labels: ['Title', 'URL'] })}
//                 </div>

//                 {/* MCQs */}
//                 <div style={{ gridColumn: 'span 2' }}>
//                     <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
//                         <h4>MCQs</h4>
//                         <button onClick={addQ}>+ Add</button>
//                     </div>
//                     <small>
//                         For options, type like: <code>A|B|C|D</code> (use | as separator). Correct index is
//                         editable in table. Add explanation to show in review/result screens.
//                     </small>

//                     {questions.map((q, i) => (
//                         <div
//                             key={q.id}
//                             style={{
//                                 display: 'grid',
//                                 gridTemplateColumns: '2fr 3fr 120px 2fr auto',
//                                 gap: 6,
//                                 marginTop: 6,
//                             }}
//                         >
//                             <input
//                                 placeholder="Question"
//                                 value={q.q}
//                                 onChange={e => {
//                                     const arr = [...questions];
//                                     arr[i] = { ...arr[i], q: e.target.value };
//                                     setQuestions(arr);
//                                 }}
//                             />
//                             <input
//                                 placeholder="Options A|B|C|D"
//                                 value={q.options.join('|')}
//                                 onChange={e => {
//                                     const arr = [...questions];
//                                     arr[i] = {
//                                         ...arr[i],
//                                         options: e.target.value.split('|'),
//                                     };
//                                     setQuestions(arr);
//                                 }}
//                             />
//                             <input
//                                 type="number"
//                                 placeholder="Correct index"
//                                 value={q.correctIndex}
//                                 onChange={e => {
//                                     const arr = [...questions];
//                                     arr[i] = {
//                                         ...arr[i],
//                                         correctIndex: Number(e.target.value) || 0,
//                                     };
//                                     setQuestions(arr);
//                                 }}
//                             />
//                             <input
//                                 placeholder="Explanation (why this is correct)"
//                                 value={q.explanation ?? ''}
//                                 onChange={e => {
//                                     const arr = [...questions];
//                                     arr[i] = {
//                                         ...arr[i],
//                                         explanation: e.target.value,
//                                     };
//                                     setQuestions(arr);
//                                 }}
//                             />
//                             <button
//                                 onClick={() => {
//                                     const arr = [...questions];
//                                     arr.splice(i, 1);
//                                     setQuestions(arr);
//                                 }}
//                             >
//                                 ✕
//                             </button>
//                         </div>
//                     ))}
//                 </div>
//             </div>

//             <button onClick={addChapter} disabled={!subjectId || !unitId || !name.trim()}>
//                 Add Chapter
//             </button>

//             <hr style={{ margin: '24px 0' }} />
//             <h3>Existing chapters</h3>
//             <table width="100%" cellPadding={8} style={{ borderCollapse: 'collapse' }}>
//                 <thead>
//                     <tr>
//                         <th align="left">Chapter</th>
//                         <th>Order</th>
//                         <th>Videos</th>
//                         <th>PDFs</th>
//                         <th>MCQs</th>
//                         <th>Actions</th>
//                     </tr>
//                 </thead>
//                 <tbody>
//                     {chapters.map(c => (
//                         <tr key={c.id} style={{ borderTop: '1px solid #eee' }}>
//                             <td>{c.name}</td>
//                             <td>
//                                 <input
//                                     type="number"
//                                     defaultValue={c.order ?? 0}
//                                     style={{ width: 80 }}
//                                     onBlur={e =>
//                                         patchChapter(c.id!, { order: Number(e.currentTarget.value) })
//                                     }
//                                 />
//                             </td>
//                             <td>{c.videos?.length || 0}</td>
//                             <td>{c.pdfs?.length || 0}</td>
//                             <td>{c.questions?.length || 0}</td>
//                             <td>
//                                 <button
//                                     onClick={() => removeChapter(c.id!)}
//                                     style={{ color: 'crimson' }}
//                                 >
//                                     Delete
//                                 </button>
//                             </td>
//                         </tr>
//                     ))}
//                     {!chapters.length && (
//                         <tr>
//                             <td colSpan={6} style={{ paddingTop: 12, color: '#777' }}>
//                                 No chapters yet for this unit.
//                             </td>
//                         </tr>
//                     )}
//                 </tbody>
//             </table>
//         </div>
//     );
// }



import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getDocs,
    orderBy,
    query,
    serverTimestamp,
    updateDoc,
    where,
} from 'firebase/firestore';
import type {
    SubjectDoc,
    UnitDoc,
    ChapterDoc,
    Video,
    Pdf,
    Question,
} from '../types';
import * as XLSX from 'xlsx';
import ImageUploader from '../components/ImageUploader';

const col = collection(db, 'nodes');

type ChapterAggregate = {
    subjectName: string;
    subjectOrder?: number;
    unitName: string;
    unitOrder?: number;
    chapterName: string;
    chapterOrder?: number;
    videos: Video[];
    pdfs: Pdf[];
    questions: Question[];
};

export default function ChaptersPage() {
    const [subjects, setSubjects] = useState<SubjectDoc[]>([]);
    const [units, setUnits] = useState<UnitDoc[]>([]);
    const [chapters, setChapters] = useState<ChapterDoc[]>([]);

    const [subjectId, setSubjectId] = useState('');
    const [unitId, setUnitId] = useState('');
    const [name, setName] = useState('');
    const [order, setOrder] = useState(1);

    // temp editors
    const [videos, setVideos] = useState<Video[]>([]);
    const [pdfs, setPdfs] = useState<Pdf[]>([]);
    const [questions, setQuestions] = useState<Question[]>([]);

    // 🔹 Edit state
    const [editingChapterId, setEditingChapterId] = useState<string | null>(null);

    // 🔹 Import state
    const [importing, setImporting] = useState(false);
    const [importLog, setImportLog] = useState<string>('');

    // ------------ LOADERS (subjects, units, chapters) ------------

    const loadSubjects = async () => {
        const q = query(
            col,
            where('type', '==', 'subject'),
            orderBy('order', 'asc'),
        );
        const snap = await getDocs(q);
        const list = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })) as SubjectDoc[];
        setSubjects(list);

        if (!subjectId && list[0]?.id) {
            setSubjectId(list[0].id);
        }
    };

    const loadUnits = async (forSubjectId?: string) => {
        const sid = forSubjectId ?? subjectId;
        if (!sid) {
            setUnits([]);
            setUnitId('');
            return;
        }

        const q = query(
            col,
            where('type', '==', 'unit'),
            where('parentId', '==', sid), // unit belongs to subject
            orderBy('order', 'asc'),
        );
        const snap = await getDocs(q);
        const list = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })) as UnitDoc[];
        setUnits(list);

        if (list[0]?.id) {
            setUnitId(list[0].id);
        } else {
            setUnitId('');
            setChapters([]);
            setOrder(1);
        }
    };

    const loadChapters = async (forUnitId?: string) => {
        const uid = forUnitId ?? unitId;
        if (!uid) {
            setChapters([]);
            setOrder(1);
            return;
        }

        const q = query(
            col,
            where('type', '==', 'chapter'),
            where('parentId', '==', uid), // chapter belongs to unit
            orderBy('order', 'asc'),
        );
        const snap = await getDocs(q);
        const list = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })) as ChapterDoc[];
        setChapters(list);

        if (list.length === 0) setOrder(1);
        else setOrder(list.length + 1);
    };

    useEffect(() => {
        loadSubjects();
    }, []);

    useEffect(() => {
        if (subjectId) {
            loadUnits(subjectId);
        } else {
            setUnits([]);
            setUnitId('');
            setChapters([]);
            setOrder(1);
        }
        setName('');
        setVideos([]);
        setPdfs([]);
        setQuestions([]);
    }, [subjectId]);

    useEffect(() => {
        if (unitId) {
            loadChapters(unitId);
        } else {
            setChapters([]);
            setOrder(1);
        }
        setName('');
        setVideos([]);
        setPdfs([]);
        setQuestions([]);
    }, [unitId]);

    // ------------ BULK IMPORT FROM EXCEL ------------

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            setImporting(true);
            setImportLog('Reading Excel file…');

            const data = await file.arrayBuffer();
            const workbook = XLSX.read(data, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];

            const rows: any[] = XLSX.utils.sheet_to_json(sheet, {
                defval: '',
            });

            if (!rows.length) {
                setImportLog('No rows found in Excel sheet.');
                return;
            }

            // 1) Group rows by Subject + Unit + Chapter
            const chapterMap = new Map<string, ChapterAggregate>();

            rows.forEach((row, index) => {
                const subjectName = String(row['Subject'] || '').trim();
                const unitName = String(row['Unit'] || '').trim();
                const chapterName = String(row['Chapter'] || '').trim();

                if (!subjectName || !unitName || !chapterName) {
                    // skip incomplete rows
                    return;
                }

                const subjectOrder = Number(row['SubjectOrder']) || undefined;
                const unitOrder = Number(row['UnitOrder']) || undefined;
                const chapterOrder = Number(row['ChapterOrder']) || undefined;

                const key = `${subjectName.toLowerCase()}||${unitName.toLowerCase()}||${chapterName.toLowerCase()}`;

                let agg = chapterMap.get(key);
                if (!agg) {
                    agg = {
                        subjectName,
                        subjectOrder,
                        unitName,
                        unitOrder,
                        chapterName,
                        chapterOrder,
                        videos: [],
                        pdfs: [],
                        questions: [],
                    };
                    chapterMap.set(key, agg);
                }

                // Videos (only fill once per chapter group)
                const videoTitlesCell = String(row['VideoTitles'] || '').trim();
                const videoUrlsCell = String(row['VideoUrls'] || '').trim();
                if (agg.videos.length === 0 && (videoTitlesCell || videoUrlsCell)) {
                    const titles = videoTitlesCell.split('|').map((t: string) => t.trim()).filter(Boolean);
                    const urls = videoUrlsCell.split('|').map((u: string) => u.trim()).filter(Boolean);
                    const count = Math.max(titles.length, urls.length);

                    for (let i = 0; i < count; i++) {
                        const title = titles[i] || `Video ${i + 1}`;
                        const url = urls[i] || '';
                        if (!url) continue;
                        agg.videos.push({
                            id: crypto.randomUUID(),
                            title,
                            url,
                        } as Video);
                    }
                }

                // PDFs (only fill once per chapter group)
                const pdfTitlesCell = String(row['PdfTitles'] || '').trim();
                const pdfUrlsCell = String(row['PdfUrls'] || '').trim();
                if (agg.pdfs.length === 0 && (pdfTitlesCell || pdfUrlsCell)) {
                    const titles = pdfTitlesCell.split('|').map((t: string) => t.trim()).filter(Boolean);
                    const urls = pdfUrlsCell.split('|').map((u: string) => u.trim()).filter(Boolean);
                    const count = Math.max(titles.length, urls.length);

                    for (let i = 0; i < count; i++) {
                        const title = titles[i] || `PDF ${i + 1}`;
                        const url = urls[i] || '';
                        if (!url) continue;
                        agg.pdfs.push({
                            id: crypto.randomUUID(),
                            title,
                            url,
                        } as Pdf);
                    }
                }

                // Questions – one per row (if present)
                const questionText = String(row['Question'] || '').trim();
                if (questionText) {
                    const optionsRaw = String(row['Options'] || '').trim();
                    const options = optionsRaw
                        ? optionsRaw.split('|').map((o: string) => o.trim()).filter(Boolean)
                        : [];

                    let correctIndex = Number(row['CorrectIndex']);
                    if (!Number.isFinite(correctIndex) || !correctIndex) {
                        correctIndex = 1; // default 1-based
                    }
                    // convert 1-based (Excel) → 0-based (app)
                    correctIndex = Math.max(0, correctIndex - 1);

                    const explanation = String(row['Explanation'] || '').trim();

                    // Image fields from Excel
                    const qImage = String(row['QuestionImage'] || row['QImage'] || '').trim();
                    const optionAImage = String(row['OptionAImage'] || row['Option1Image'] || '').trim();
                    const optionBImage = String(row['OptionBImage'] || row['Option2Image'] || '').trim();
                    const optionCImage = String(row['OptionCImage'] || row['Option3Image'] || '').trim();
                    const optionDImage = String(row['OptionDImage'] || row['Option4Image'] || '').trim();
                    const explanationImage = String(row['ExplanationImage'] || '').trim();

                    agg.questions.push({
                        id: crypto.randomUUID(),
                        q: questionText,
                        qImage,
                        options,
                        optionImages: [optionAImage, optionBImage, optionCImage, optionDImage],
                        correctIndex,
                        explanation,
                        explanationImage,
                    } as Question);
                }
            });

            setImportLog(
                `Parsed ${rows.length} rows. Grouped into ${chapterMap.size} chapters. Preparing Firestore writes…`,
            );

            // 2) Load existing subjects & units so we don't duplicate
            const subjectByName = new Map<string, { id: string; order?: number }>();
            const unitByKey = new Map<string, { id: string }>(); // key = subjectId||unitNameLower

            const subjSnap = await getDocs(
                query(col, where('type', '==', 'subject')),
            );
            subjSnap.forEach(docSnap => {
                const data = docSnap.data() as any;
                const n = String(data.name || '').trim();
                if (!n) return;
                subjectByName.set(n.toLowerCase(), { id: docSnap.id, order: data.order });
            });

            const unitSnap = await getDocs(
                query(col, where('type', '==', 'unit')),
            );
            unitSnap.forEach(docSnap => {
                const data = docSnap.data() as any;
                const n = String(data.name || '').trim();
                const parentId = data.parentId as string | undefined;
                if (!n || !parentId) return;
                const key = `${parentId}||${n.toLowerCase()}`;
                unitByKey.set(key, { id: docSnap.id });
            });

            let createdSubjects = 0;
            let createdUnits = 0;
            let createdChapters = 0;

            // 3) Write to Firestore
            for (const agg of chapterMap.values()) {
                // --- Subject ---
                const subjKey = agg.subjectName.toLowerCase();
                let subjId: string;
                const existingSubj = subjectByName.get(subjKey);
                if (existingSubj) {
                    subjId = existingSubj.id;
                } else {
                    const subjRef = await addDoc(col, {
                        type: 'subject',
                        name: agg.subjectName,
                        order: agg.subjectOrder ?? subjectByName.size + 1,
                        active: true,
                        createdAt: serverTimestamp(),
                    });
                    subjId = subjRef.id;
                    subjectByName.set(subjKey, { id: subjId, order: agg.subjectOrder });
                    createdSubjects++;
                }

                // --- Unit ---
                const unitKey = `${subjId}||${agg.unitName.toLowerCase()}`;
                let unitIdLocal: string;
                const existingUnit = unitByKey.get(unitKey);
                if (existingUnit) {
                    unitIdLocal = existingUnit.id;
                } else {
                    const unitRef = await addDoc(col, {
                        type: 'unit',
                        name: agg.unitName,
                        parentId: subjId,
                        subjectId: subjId,
                        order: agg.unitOrder ?? 1,
                        active: true,
                        createdAt: serverTimestamp(),
                    });
                    unitIdLocal = unitRef.id;
                    unitByKey.set(unitKey, { id: unitIdLocal });
                    createdUnits++;
                }

                // --- Chapter ---
                const chapterData: Partial<ChapterDoc> = {
                    type: 'chapter',
                    parentId: unitIdLocal,
                    subjectId: subjId,
                    unitId: unitIdLocal,
                    name: agg.chapterName,
                    order: agg.chapterOrder ?? 1,
                    videos: agg.videos,
                    pdfs: agg.pdfs,
                    questions: agg.questions,
                    createdAt: serverTimestamp(),
                } as any;

                await addDoc(col, chapterData);
                createdChapters++;
            }

            setImportLog(
                `✅ Import completed.\nSubjects created: ${createdSubjects}\nUnits created: ${createdUnits}\nChapters created: ${createdChapters}`,
            );

            // refresh UI (reload current subject/unit lists)
            await loadSubjects();
            if (subjectId) {
                await loadUnits(subjectId);
            }
            if (unitId) {
                await loadChapters(unitId);
            }
        } catch (err: any) {
            console.error(err);
            setImportLog(`❌ Import failed: ${err.message || String(err)}`);
        } finally {
            setImporting(false);
        }
    };

    // ------------ CRUD HELPERS FOR CHAPTERS ------------

    const addChapter = async () => {
        if (!subjectId || !unitId || !name.trim()) return;

        const chapterData: Partial<ChapterDoc> = {
            type: 'chapter',
            parentId: unitId,
            subjectId,
            unitId,
            name: name.trim(),
            order: Number(order) || 0,
            videos,
            pdfs,
            questions,
            createdAt: serverTimestamp(),
        } as any;

        await addDoc(col, chapterData);

        clearForm();
        await loadChapters(unitId);
    };

    const updateChapter = async () => {
        if (!editingChapterId || !name.trim()) return;

        const chapterData: Partial<ChapterDoc> = {
            name: name.trim(),
            order: Number(order) || 0,
            videos,
            pdfs,
            questions,
        };

        await updateDoc(doc(db, 'nodes', editingChapterId), chapterData as any);

        clearForm();
        await loadChapters(unitId);
    };

    const startEditChapter = (chapter: ChapterDoc) => {
        setEditingChapterId(chapter.id!);
        setName(chapter.name || '');
        setOrder(chapter.order || 1);
        setVideos(chapter.videos || []);
        setPdfs(chapter.pdfs || []);
        // Ensure questions have all required fields including image fields
        const loadedQuestions = (chapter.questions || []).map(q => ({
            ...q,
            qImage: q.qImage || '',
            optionImages: q.optionImages || ['', '', '', ''],
            explanationImage: q.explanationImage || '',
        }));
        setQuestions(loadedQuestions);
    };

    const clearForm = () => {
        setEditingChapterId(null);
        setName('');
        setVideos([]);
        setPdfs([]);
        setQuestions([]);
    };

    const patchChapter = async (id: string, patch: Partial<ChapterDoc>) => {
        await updateDoc(doc(db, 'nodes', id), patch as any);
        await loadChapters();
    };

    const removeChapter = async (id: string) => {
        if (!window.confirm('Delete this chapter?')) return;
        await deleteDoc(doc(db, 'nodes', id));
        if (editingChapterId === id) {
            clearForm();
        }
        await loadChapters();
    };

    // ------------ SMALL EDITOR FOR VIDEOS/PDFS ------------

    const MutList = <T extends { id: string }>({
        items,
        setItems,
        labels,
    }: {
        items: T[];
        setItems: (x: T[]) => void;
        labels: [string, string];
    }) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {items.map((it: any, idx) => (
                <div
                    key={it.id}
                    style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 2fr auto',
                        gap: 6,
                    }}
                >
                    <input
                        placeholder={labels[0]}
                        value={it.title || it.q || ''}
                        onChange={e => {
                            const arr = [...items] as any;
                            if (arr[idx].title !== undefined) arr[idx].title = e.target.value;
                            else arr[idx].q = e.target.value;
                            setItems(arr);
                        }}
                    />
                    <input
                        placeholder={labels[1]}
                        value={it.url ?? (it.options?.join('|') ?? '')}
                        onChange={e => {
                            const arr = [...items] as any;
                            if (arr[idx].url !== undefined) arr[idx].url = e.target.value;
                            else arr[idx].options = e.target.value.split('|');
                            setItems(arr);
                        }}
                    />
                    <button
                        onClick={() => {
                            const arr = [...items];
                            arr.splice(idx, 1);
                            setItems(arr);
                        }}
                    >
                        ✕
                    </button>
                </div>
            ))}
        </div>
    );

    const addVideo = () =>
        setVideos(v => [...v, { id: crypto.randomUUID(), title: '', url: '' } as Video]);

    const addPdf = () =>
        setPdfs(p => [...p, { id: crypto.randomUUID(), title: '', url: '' } as Pdf]);

    const addQ = () =>
        setQuestions(q => [
            ...q,
            {
                id: crypto.randomUUID(),
                q: '',
                qImage: '',
                options: ['', '', '', ''],
                optionImages: ['', '', '', ''],
                correctIndex: 0,
                explanation: '',
                explanationImage: '',
            } as Question,
        ]);

    // ------------ RENDER ------------

    return (
        <div style={{ padding: 16 }}>
            <h2>Chapters & Content</h2>

            {/* 🔹 Bulk import from Excel */}
            <div
                style={{
                    border: '1px solid #ddd',
                    padding: 12,
                    borderRadius: 8,
                    marginBottom: 16,
                    background: '#fafafa',
                }}
            >
                <h3>Bulk Import from Excel</h3>
                <p style={{ marginBottom: 8 }}>
                    Upload an <b>.xlsx</b> file with columns:
                    <code>
                        {' '}
                        Subject, SubjectOrder, Unit, UnitOrder, Chapter, ChapterOrder,
                        VideoTitles, VideoUrls, PdfTitles, PdfUrls, Question, Options,
                        CorrectIndex, Explanation, QuestionImage, OptionAImage-DImage, ExplanationImage
                    </code>
                </p>
                <input
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleFileChange}
                    disabled={importing}
                />
                {importing && <p>Importing… please wait.</p>}
                {importLog && (
                    <pre
                        style={{
                            marginTop: 8,
                            padding: 8,
                            background: '#111',
                            color: '#0f0',
                            fontSize: 12,
                            maxHeight: 200,
                            overflow: 'auto',
                        }}
                    >
                        {importLog}
                    </pre>
                )}
            </div>

            {/* Subject + Unit selectors */}
            <div
                style={{
                    display: 'flex',
                    gap: 8,
                    alignItems: 'center',
                    marginBottom: 12,
                }}
            >
                <label>Subject</label>
                <select
                    value={subjectId}
                    onChange={e => setSubjectId(e.target.value)}
                >
                    {subjects.map(s => (
                        <option key={s.id} value={s.id}>
                            {s.name}
                        </option>
                    ))}
                    {subjects.length === 0 && <option>No subjects</option>}
                </select>

                <label>Unit</label>
                <select
                    value={unitId}
                    onChange={e => setUnitId(e.target.value)}
                >
                    {units.map(u => (
                        <option key={u.id} value={u.id}>
                            {u.name}
                        </option>
                    ))}
                    {units.length === 0 && <option>No units</option>}
                </select>
            </div>

            {/* Chapter basic info */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                <input
                    placeholder="Chapter name"
                    value={name}
                    onChange={e => setName(e.target.value)}
                />
                <input
                    type="number"
                    placeholder="Order"
                    value={order}
                    onChange={e => setOrder(Number(e.target.value))}
                    style={{ width: 100 }}
                />
            </div>

            {/* Content editors */}
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: 16,
                    marginBottom: 16,
                }}
            >
                {/* Videos */}
                <div>
                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                        }}
                    >
                        <h4>Videos</h4>
                        <button onClick={addVideo}>+ Add</button>
                    </div>
                    {MutList({ items: videos, setItems: setVideos, labels: ['Title', 'URL'] })}
                </div>

                {/* PDFs */}
                <div>
                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                        }}
                    >
                        <h4>PDFs</h4>
                        <button onClick={addPdf}>+ Add</button>
                    </div>
                    {MutList({ items: pdfs, setItems: setPdfs, labels: ['Title', 'URL'] })}
                </div>

                {/* MCQs */}
                <div style={{ gridColumn: 'span 2' }}>
                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                        }}
                    >
                        <h4>MCQs</h4>
                        <button onClick={addQ}>+ Add</button>
                    </div>
                    <small>
                        For options, type like: <code>A|B|C|D</code> (use | as separator).{' '}
                        <b>CorrectIndex</b> in Excel is 1-based (1=A, 2=B, 3=C, 4=D…).
                    </small>

                    {questions.map((q, i) => (
                        <div
                            key={q.id}
                            style={{
                                marginTop: 12,
                                padding: 12,
                                border: '1px solid #e5e7eb',
                                borderRadius: 10,
                                background: '#fff',
                                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                            }}
                        >
                            {/* Header */}
                            <div
                                style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    marginBottom: 10,
                                    paddingBottom: 8,
                                    borderBottom: '1px solid #e5e7eb',
                                }}
                            >
                                <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>Q{i + 1}</span>
                                <button
                                    onClick={() => {
                                        const arr = [...questions];
                                        arr.splice(i, 1);
                                        setQuestions(arr);
                                    }}
                                    style={{ color: '#dc2626', background: '#fef2f2', border: '1px solid #fecaca', padding: '4px 10px', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}
                                >
                                    Delete
                                </button>
                            </div>

                            {/* SECTION 1: Question Text */}
                            <div style={{ marginBottom: 12, padding: 10, background: '#f0f9ff', borderRadius: 8, border: '1px solid #bae6fd' }}>
                                <label style={{ fontSize: 11, color: '#0369a1', display: 'block', marginBottom: 4, fontWeight: 600 }}>
                                    Question Text
                                </label>
                                <textarea
                                    placeholder="Enter the question text here..."
                                    value={q.q}
                                    onChange={e => {
                                        const arr = [...questions];
                                        arr[i] = { ...arr[i], q: e.target.value };
                                        setQuestions(arr);
                                    }}
                                    rows={2}
                                    style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #e5e7eb', fontSize: 13, resize: 'vertical' }}
                                />
                                {/* Question Image */}
                                <div style={{ marginTop: 8 }}>
                                    <ImageUploader
                                        label="Question Image (optional - for diagrams/figures)"
                                        value={q.qImage || ''}
                                        onChange={(url) => {
                                            const arr = [...questions];
                                            arr[i] = { ...arr[i], qImage: url };
                                            setQuestions(arr);
                                        }}
                                        folder="questions"
                                    />
                                </div>
                            </div>

                            {/* SECTION 2: Answer Options */}
                            <div style={{ marginBottom: 12, padding: 10, background: '#f0fdf4', borderRadius: 8, border: '1px solid #bbf7d0' }}>
                                <label style={{ fontSize: 11, color: '#15803d', display: 'block', marginBottom: 8, fontWeight: 600 }}>
                                    Answer Options (select the correct one)
                                </label>

                                {/* Text Options with Radio Buttons */}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
                                    {[0, 1, 2, 3].map((optIdx) => (
                                        <label
                                            key={optIdx}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 8,
                                                padding: '8px 10px',
                                                background: q.correctIndex === optIdx ? '#dcfce7' : '#fff',
                                                borderRadius: 6,
                                                border: q.correctIndex === optIdx ? '2px solid #22c55e' : '1px solid #e5e7eb',
                                                cursor: 'pointer',
                                            }}
                                        >
                                            <input
                                                type="radio"
                                                name={`correct_chapter_${q.id}`}
                                                checked={q.correctIndex === optIdx}
                                                onChange={() => {
                                                    const arr = [...questions];
                                                    arr[i] = { ...arr[i], correctIndex: optIdx };
                                                    setQuestions(arr);
                                                }}
                                                style={{ accentColor: '#22c55e' }}
                                            />
                                            <span style={{ color: '#6b7280', fontSize: 12, minWidth: 20, fontWeight: 600 }}>
                                                {String.fromCharCode(65 + optIdx)}.
                                            </span>
                                            <input
                                                value={(q.options || ['', '', '', ''])[optIdx] || ''}
                                                onChange={e => {
                                                    const arr = [...questions];
                                                    const opts = [...(arr[i].options || ['', '', '', ''])];
                                                    opts[optIdx] = e.target.value;
                                                    arr[i] = { ...arr[i], options: opts };
                                                    setQuestions(arr);
                                                }}
                                                placeholder={`Option ${String.fromCharCode(65 + optIdx)} text`}
                                                style={{ flex: 1, padding: '4px 8px', borderRadius: 4, border: '1px solid #e5e7eb', fontSize: 12 }}
                                            />
                                        </label>
                                    ))}
                                </div>

                                {/* Image Options (collapsible) */}
                                <details>
                                    <summary style={{
                                        fontSize: 11,
                                        color: '#d97706',
                                        cursor: 'pointer',
                                        padding: '6px 10px',
                                        background: '#fffbeb',
                                        borderRadius: 6,
                                        border: '1px dashed #fbbf24',
                                    }}>
                                        Image Options (only if answers are images instead of text)
                                    </summary>
                                    <div style={{ marginTop: 8, padding: 10, background: '#fffbeb', borderRadius: 6, border: '1px solid #fbbf24' }}>
                                        <p style={{ fontSize: 10, color: '#b45309', marginBottom: 8 }}>
                                            Use this ONLY when answer choices are images (diagrams, graphs) instead of text.
                                        </p>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                                            {[0, 1, 2, 3].map((optIdx) => (
                                                <div key={optIdx} style={{
                                                    padding: 8,
                                                    background: '#fff',
                                                    borderRadius: 6,
                                                    border: q.correctIndex === optIdx ? '2px solid #22c55e' : '1px solid #e5e7eb',
                                                }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                                                        <input
                                                            type="radio"
                                                            name={`correct_img_chapter_${q.id}`}
                                                            checked={q.correctIndex === optIdx}
                                                            onChange={() => {
                                                                const arr = [...questions];
                                                                arr[i] = { ...arr[i], correctIndex: optIdx };
                                                                setQuestions(arr);
                                                            }}
                                                            style={{ accentColor: '#22c55e' }}
                                                        />
                                                        <span style={{ fontSize: 11, color: '#6b7280', fontWeight: 600 }}>
                                                            Option {String.fromCharCode(65 + optIdx)}
                                                        </span>
                                                        {q.correctIndex === optIdx && (
                                                            <span style={{ fontSize: 9, color: '#22c55e', marginLeft: 'auto', fontWeight: 600 }}>CORRECT</span>
                                                        )}
                                                    </div>
                                                    <ImageUploader
                                                        value={(q.optionImages || [])[optIdx] || ''}
                                                        onChange={(url) => {
                                                            const arr = [...questions];
                                                            const optImgs = [...(arr[i].optionImages || ['', '', '', ''])];
                                                            optImgs[optIdx] = url;
                                                            arr[i] = { ...arr[i], optionImages: optImgs };
                                                            setQuestions(arr);
                                                        }}
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
                            <div style={{ padding: 10, background: '#faf5ff', borderRadius: 8, border: '1px solid #e9d5ff' }}>
                                <label style={{ fontSize: 11, color: '#7c3aed', display: 'block', marginBottom: 4, fontWeight: 600 }}>
                                    Explanation (shown after wrong answer)
                                </label>
                                <textarea
                                    placeholder="Explain why the correct option is right..."
                                    value={q.explanation ?? ''}
                                    onChange={e => {
                                        const arr = [...questions];
                                        arr[i] = { ...arr[i], explanation: e.target.value };
                                        setQuestions(arr);
                                    }}
                                    rows={2}
                                    style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #e5e7eb', fontSize: 12, resize: 'vertical' }}
                                />
                                {/* Explanation Image */}
                                <div style={{ marginTop: 8 }}>
                                    <ImageUploader
                                        label="Explanation Image (optional - for solution diagrams)"
                                        value={q.explanationImage || ''}
                                        onChange={(url) => {
                                            const arr = [...questions];
                                            arr[i] = { ...arr[i], explanationImage: url };
                                            setQuestions(arr);
                                        }}
                                        folder="questions/explanations"
                                    />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 16 }}>
                {editingChapterId ? (
                    <>
                        <button
                            onClick={updateChapter}
                            disabled={!name.trim()}
                            style={{
                                background: '#2563eb',
                                color: '#fff',
                                border: 'none',
                                padding: '10px 20px',
                                borderRadius: 6,
                                cursor: 'pointer',
                                fontWeight: 600,
                            }}
                        >
                            Update Chapter
                        </button>
                        <button
                            onClick={clearForm}
                            style={{
                                background: '#f3f4f6',
                                color: '#374151',
                                border: '1px solid #d1d5db',
                                padding: '10px 20px',
                                borderRadius: 6,
                                cursor: 'pointer',
                            }}
                        >
                            Cancel Edit
                        </button>
                        <span style={{ fontSize: 12, color: '#6b7280' }}>
                            Editing: <strong>{name || '(unnamed)'}</strong>
                        </span>
                    </>
                ) : (
                    <button
                        onClick={addChapter}
                        disabled={!subjectId || !unitId || !name.trim()}
                        style={{
                            background: '#16a34a',
                            color: '#fff',
                            border: 'none',
                            padding: '10px 20px',
                            borderRadius: 6,
                            cursor: 'pointer',
                            fontWeight: 600,
                            opacity: (!subjectId || !unitId || !name.trim()) ? 0.5 : 1,
                        }}
                    >
                        + Add Chapter
                    </button>
                )}
            </div>

            <hr style={{ margin: '24px 0' }} />
            <h3>Existing chapters</h3>
            <table width="100%" cellPadding={8} style={{ borderCollapse: 'collapse' }}>
                <thead>
                    <tr style={{ background: '#f9fafb' }}>
                        <th align="left">Chapter</th>
                        <th>Order</th>
                        <th>Videos</th>
                        <th>PDFs</th>
                        <th>MCQs</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {chapters.map(c => (
                        <tr
                            key={c.id}
                            style={{
                                borderTop: '1px solid #eee',
                                background: editingChapterId === c.id ? '#eff6ff' : 'transparent',
                            }}
                        >
                            <td style={{ fontWeight: editingChapterId === c.id ? 600 : 400 }}>
                                {c.name}
                                {editingChapterId === c.id && (
                                    <span style={{ marginLeft: 8, fontSize: 10, color: '#2563eb', background: '#dbeafe', padding: '2px 6px', borderRadius: 4 }}>
                                        EDITING
                                    </span>
                                )}
                            </td>
                            <td>
                                <input
                                    type="number"
                                    defaultValue={c.order ?? 0}
                                    style={{ width: 80 }}
                                    onBlur={e =>
                                        patchChapter(c.id!, {
                                            order: Number(e.currentTarget.value),
                                        })
                                    }
                                />
                            </td>
                            <td>{c.videos?.length || 0}</td>
                            <td>{c.pdfs?.length || 0}</td>
                            <td>{c.questions?.length || 0}</td>
                            <td style={{ display: 'flex', gap: 8 }}>
                                <button
                                    onClick={() => startEditChapter(c)}
                                    disabled={editingChapterId === c.id}
                                    style={{
                                        color: '#2563eb',
                                        background: '#eff6ff',
                                        border: '1px solid #bfdbfe',
                                        padding: '4px 10px',
                                        borderRadius: 4,
                                        cursor: editingChapterId === c.id ? 'default' : 'pointer',
                                        opacity: editingChapterId === c.id ? 0.5 : 1,
                                    }}
                                >
                                    Edit
                                </button>
                                <button
                                    onClick={() => removeChapter(c.id!)}
                                    style={{
                                        color: '#dc2626',
                                        background: '#fef2f2',
                                        border: '1px solid #fecaca',
                                        padding: '4px 10px',
                                        borderRadius: 4,
                                        cursor: 'pointer',
                                    }}
                                >
                                    Delete
                                </button>
                            </td>
                        </tr>
                    ))}
                    {!chapters.length && (
                        <tr>
                            <td colSpan={6} style={{ paddingTop: 12, color: '#777' }}>
                                No chapters yet for this unit.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}
