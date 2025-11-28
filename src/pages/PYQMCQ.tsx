// src/admin/PYQMCQ.tsx (or wherever you keep this component)
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
} from 'firebase/firestore';
import { db } from '../firebase';

/** Same shape as app side */
type Question = {
    id: string;
    q: string;
    options: string[];
    correctIndex: number;
    explanation?: string;   // ✅ explanation field
};

type PYQPaperDoc = {
    id: string;
    exam: string;
    year: number;
    title: string;
    questions: Question[];
};

const nodesCol = collection(db, 'nodes');

function makeEmptyQuestion(): Question {
    const id =
        typeof crypto !== 'undefined' && 'randomUUID' in crypto
            ? crypto.randomUUID()
            : `q_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    return {
        id,
        q: '',
        options: ['', '', '', ''],
        correctIndex: 0,
        explanation: '',       // ✅ default empty explanation
    };
}

export default function PYQMCQ() {
    const [papers, setPapers] = useState<PYQPaperDoc[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [currentId, setCurrentId] = useState<string | null>(null);
    const [current, setCurrent] = useState<PYQPaperDoc | null>(null);

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
                const rawQs: any[] = Array.isArray(data.questions) ? data.questions : [];

                const questions: Question[] = rawQs.map((q: any, idx: number) => ({
                    id: q.id || `${d.id}_${idx}`,
                    q: q.q ?? '',
                    options: Array.isArray(q.options) ? q.options : ['', '', '', ''],
                    correctIndex: typeof q.correctIndex === 'number' ? q.correctIndex : 0,
                    explanation: q.explanation ?? '',   // ✅ load explanation
                }));

                return {
                    id: d.id,
                    exam: data.exam ?? 'NEET',
                    year: Number(data.year) || 0,
                    title: data.title ?? `${data.exam ?? 'NEET'} ${data.year ?? ''} – Full Exam`,
                    questions,
                };
            });

            setPapers(list);

            if (!currentId && list.length > 0) {
                setCurrentId(list[0].id);
                setCurrent(list[0]);
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

    const handleUpdateOption = (qid: string, optIndex: number, value: string) => {
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

            const payload = {
                type: 'pyq_mcq', // 🔑 important for filter in app + admin
                exam: current.exam,
                year: current.year,
                title: current.title,
                questions: current.questions.map(q => ({
                    id: q.id,
                    q: q.q,
                    options: q.options,
                    correctIndex: q.correctIndex,
                    explanation: q.explanation ?? '', // ✅ save explanation
                })),
            };

            if (current.id === '_new_') {
                await addDoc(nodesCol, payload);
            } else {
                const ref = doc(nodesCol, current.id);
                await updateDoc(ref, payload);
            }

            await loadPapers();
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
                fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
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
                <p style={{ fontSize: 12, color: '#9ca3af', marginBottom: 12 }}>
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

                {error && <p style={{ fontSize: 12, color: '#f97373' }}>{error}</p>}

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
                                    background: currentId === p.id ? '#1e293b' : 'transparent',
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
                                    onChange={e => updateCurrent('exam', e.target.value)}
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
                                        updateCurrent('year', Number(e.target.value) || 0)
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
                                    onChange={e => updateCurrent('title', e.target.value)}
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

                        {/* Questions header */}
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: 8,
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
                                    Each question should have 4 options. Select the correct one
                                    with the radio button. Explanation will be shown in the app
                                    when the student answers incorrectly.
                                </p>
                            </div>

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
                        </div>

                        {/* Questions list */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
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
                                            onClick={() => handleDeleteQuestion(q.id)}
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

                                    <textarea
                                        value={q.q}
                                        onChange={e =>
                                            handleUpdateQuestionField(q.id, 'q', e.target.value)
                                        }
                                        placeholder="Question text"
                                        rows={2}
                                        style={{
                                            width: '100%',
                                            borderRadius: 8,
                                            border: '1px solid #1f2937',
                                            background: '#020617',
                                            color: '#e5e7eb',
                                            fontSize: 13,
                                            padding: '6px 8px',
                                            marginBottom: 6,
                                            resize: 'vertical',
                                        }}
                                    />

                                    <div
                                        style={{
                                            display: 'grid',
                                            gridTemplateColumns: '1fr 1fr',
                                            gap: 8,
                                            marginBottom: 6,
                                        }}
                                    >
                                        {q.options.map((opt, i) => (
                                            <label
                                                key={i}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 6,
                                                    fontSize: 12,
                                                    color: '#e5e7eb',
                                                }}
                                            >
                                                <input
                                                    type="radio"
                                                    name={`correct_${q.id}`}
                                                    checked={q.correctIndex === i}
                                                    onChange={() =>
                                                        handleUpdateQuestionField(q.id, 'correctIndex', i)
                                                    }
                                                />
                                                <input
                                                    value={opt}
                                                    onChange={e =>
                                                        handleUpdateOption(q.id, i, e.target.value)
                                                    }
                                                    placeholder={`Option ${i + 1}`}
                                                    style={{
                                                        flex: 1,
                                                        padding: '4px 6px',
                                                        borderRadius: 6,
                                                        border: '1px solid #1f2937',
                                                        background: '#020617',
                                                        color: '#e5e7eb',
                                                        fontSize: 12,
                                                    }}
                                                />
                                            </label>
                                        ))}
                                    </div>

                                    {/* ✅ Explanation field */}
                                    <label
                                        style={{
                                            fontSize: 11,
                                            color: '#9ca3af',
                                            display: 'block',
                                            marginBottom: 2,
                                        }}
                                    >
                                        Explanation (shown in app after a wrong answer)
                                    </label>
                                    <textarea
                                        value={q.explanation || ''}
                                        onChange={e =>
                                            handleUpdateQuestionField(
                                                q.id,
                                                'explanation',
                                                e.target.value,
                                            )
                                        }
                                        placeholder="Explain why this option is correct. Students will see this when they get it wrong."
                                        rows={2}
                                        style={{
                                            width: '100%',
                                            borderRadius: 8,
                                            border: '1px solid #1f2937',
                                            background: '#020617',
                                            color: '#e5e7eb',
                                            fontSize: 12,
                                            padding: '6px 8px',
                                            resize: 'vertical',
                                        }}
                                    />
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
