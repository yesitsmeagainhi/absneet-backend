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

const col = collection(db, 'nodes');

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

        // auto-select first unit for this subject
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

        // update default order based on count
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
        // reset editors when subject changes
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
        // reset chapter form when unit changes
        setName('');
        setVideos([]);
        setPdfs([]);
        setQuestions([]);
    }, [unitId]);

    // ------------ CRUD HELPERS FOR CHAPTERS ------------

    const addChapter = async () => {
        if (!subjectId || !unitId || !name.trim()) return;

        const chapterData: Partial<ChapterDoc> = {
            type: 'chapter',
            // 🔗 tree linking
            parentId: unitId,   // immediate parent
            subjectId,          // ancestor subject
            unitId,             // explicit unit
            name: name.trim(),
            order: Number(order) || 0,
            videos,
            pdfs,
            questions,          // ✅ includes explanation field now
            createdAt: serverTimestamp(),
        } as any;

        await addDoc(col, chapterData);

        // reset form
        setName('');
        setVideos([]);
        setPdfs([]);
        setQuestions([]);

        await loadChapters(unitId);
    };

    const patchChapter = async (id: string, patch: Partial<ChapterDoc>) => {
        await updateDoc(doc(db, 'nodes', id), patch as any);
        await loadChapters();
    };

    const removeChapter = async (id: string) => {
        if (!window.confirm('Delete this chapter?')) return;
        await deleteDoc(doc(db, 'nodes', id));
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
                    style={{ display: 'grid', gridTemplateColumns: '1fr 2fr auto', gap: 6 }}
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

    // helpers to add new rows
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
                options: ['', '', ''],
                correctIndex: 0,
                explanation: '',            // ✅ new field default
            } as Question,
        ]);

    // ------------ RENDER ------------

    return (
        <div style={{ padding: 16 }}>
            <h2>Chapters & Content</h2>

            {/* Subject + Unit selectors */}
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
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
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h4>Videos</h4>
                        <button onClick={addVideo}>+ Add</button>
                    </div>
                    {MutList({ items: videos, setItems: setVideos, labels: ['Title', 'URL'] })}
                </div>

                {/* PDFs */}
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h4>PDFs</h4>
                        <button onClick={addPdf}>+ Add</button>
                    </div>
                    {MutList({ items: pdfs, setItems: setPdfs, labels: ['Title', 'URL'] })}
                </div>

                {/* MCQs */}
                <div style={{ gridColumn: 'span 2' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h4>MCQs</h4>
                        <button onClick={addQ}>+ Add</button>
                    </div>
                    <small>
                        For options, type like: <code>A|B|C|D</code> (use | as separator). Correct index is
                        editable in table. Add explanation to show in review/result screens.
                    </small>

                    {questions.map((q, i) => (
                        <div
                            key={q.id}
                            style={{
                                display: 'grid',
                                gridTemplateColumns: '2fr 3fr 120px 2fr auto',
                                gap: 6,
                                marginTop: 6,
                            }}
                        >
                            <input
                                placeholder="Question"
                                value={q.q}
                                onChange={e => {
                                    const arr = [...questions];
                                    arr[i] = { ...arr[i], q: e.target.value };
                                    setQuestions(arr);
                                }}
                            />
                            <input
                                placeholder="Options A|B|C|D"
                                value={q.options.join('|')}
                                onChange={e => {
                                    const arr = [...questions];
                                    arr[i] = {
                                        ...arr[i],
                                        options: e.target.value.split('|'),
                                    };
                                    setQuestions(arr);
                                }}
                            />
                            <input
                                type="number"
                                placeholder="Correct index"
                                value={q.correctIndex}
                                onChange={e => {
                                    const arr = [...questions];
                                    arr[i] = {
                                        ...arr[i],
                                        correctIndex: Number(e.target.value) || 0,
                                    };
                                    setQuestions(arr);
                                }}
                            />
                            <input
                                placeholder="Explanation (why this is correct)"
                                value={q.explanation ?? ''}
                                onChange={e => {
                                    const arr = [...questions];
                                    arr[i] = {
                                        ...arr[i],
                                        explanation: e.target.value,
                                    };
                                    setQuestions(arr);
                                }}
                            />
                            <button
                                onClick={() => {
                                    const arr = [...questions];
                                    arr.splice(i, 1);
                                    setQuestions(arr);
                                }}
                            >
                                ✕
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            <button onClick={addChapter} disabled={!subjectId || !unitId || !name.trim()}>
                Add Chapter
            </button>

            <hr style={{ margin: '24px 0' }} />
            <h3>Existing chapters</h3>
            <table width="100%" cellPadding={8} style={{ borderCollapse: 'collapse' }}>
                <thead>
                    <tr>
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
                        <tr key={c.id} style={{ borderTop: '1px solid #eee' }}>
                            <td>{c.name}</td>
                            <td>
                                <input
                                    type="number"
                                    defaultValue={c.order ?? 0}
                                    style={{ width: 80 }}
                                    onBlur={e =>
                                        patchChapter(c.id!, { order: Number(e.currentTarget.value) })
                                    }
                                />
                            </td>
                            <td>{c.videos?.length || 0}</td>
                            <td>{c.pdfs?.length || 0}</td>
                            <td>{c.questions?.length || 0}</td>
                            <td>
                                <button
                                    onClick={() => removeChapter(c.id!)}
                                    style={{ color: 'crimson' }}
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
