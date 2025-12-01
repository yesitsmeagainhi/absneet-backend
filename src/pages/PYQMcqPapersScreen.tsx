// src/admin/PYQMcqPapersPage.tsx
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
    updateDoc,           // 👈 NEW: for editing
} from 'firebase/firestore';
import type { Question } from '../types'; // make sure Question has "explanation?: string"

type PYQPaper = {
    id?: string;
    exam: string;
    year: number;
    title?: string;
    questions: Question[];
};

const col = collection(db, 'nodes');

export default function PYQMcqPapersPage() {
    const [papers, setPapers] = useState<PYQPaper[]>([]);

    // form state (for create + edit)
    const [exam, setExam] = useState('NEET');
    const [year, setYear] = useState<number | ''>('');
    const [title, setTitle] = useState('');
    const [questions, setQuestions] = useState<Question[]>([]);

    // 👇 NEW: track which paper is being edited (null = create mode)
    const [editingId, setEditingId] = useState<string | null>(null);

    const loadPapers = async () => {
        const q = query(col, orderBy('year', 'desc'));
        const snap = await getDocs(q);
        const list: PYQPaper[] = snap.docs.map(d => {
            const data = d.data() as any;
            return {
                id: d.id,
                exam: data.exam ?? 'NEET',
                year: data.year ?? 0,
                title: data.title ?? '',
                questions: Array.isArray(data.questions) ? data.questions : [],
            };
        });
        setPapers(list);
    };

    useEffect(() => {
        loadPapers();
    }, []);

    const addQuestion = () => {
        setQuestions(prev => [
            ...prev,
            {
                id: crypto.randomUUID(),
                q: '',
                options: ['', '', '', ''],
                correctIndex: 0,
                explanation: '',
            } as Question,
        ]);
    };

    const removeQuestion = (idx: number) => {
        const arr = [...questions];
        arr.splice(idx, 1);
        setQuestions(arr);
    };

    const updateQuestionField = (
        idx: number,
        field: keyof Question,
        value: any,
    ) => {
        const arr = [...questions];
        (arr[idx] as any)[field] = value;
        setQuestions(arr);
    };

    const updateOptions = (idx: number, value: string) => {
        const arr = [...questions];
        arr[idx] = {
            ...arr[idx],
            options: value.split('|'),
        };
        setQuestions(arr);
    };

    // 👇 NEW: reset form (for after save / cancel)
    const resetForm = () => {
        setExam('NEET');
        setYear('');
        setTitle('');
        setQuestions([]);
        setEditingId(null);
    };

    // 👇 NEW: main save handler (create OR update)
    const savePaper = async () => {
        if (!year || !exam || questions.length === 0) {
            alert('Please fill exam, year and add at least one question.');
            return;
        }

        const payload: Omit<PYQPaper, 'id'> = {
            exam: exam.trim(),
            year: Number(year),
            title: title.trim() || `${exam} ${year} Full MCQ Paper`,
            questions,
        };

        if (editingId) {
            // 🔄 UPDATE existing document
            await updateDoc(doc(db, 'nodes', editingId), {
                ...payload,
                updatedAt: serverTimestamp(),
            });
        } else {
            // 🆕 CREATE new document
            await addDoc(col, {
                ...payload,
                createdAt: serverTimestamp(),
            });
        }

        resetForm();
        await loadPapers();
    };

    const removePaper = async (id?: string) => {
        if (!id) return;
        if (!window.confirm('Delete this PYQ paper?')) return;
        await deleteDoc(doc(db, 'nodes', id));
        // If you deleted the one you were editing → reset form
        if (editingId === id) resetForm();
        await loadPapers();
    };

    // 👇 NEW: populate form for editing
    const startEditPaper = (paper: PYQPaper) => {
        setEditingId(paper.id || null);
        setExam(paper.exam || 'NEET');
        setYear(paper.year || '');
        setTitle(paper.title || '');
        setQuestions(
            (paper.questions || []).map(q => ({
                id: q.id || crypto.randomUUID(),
                q: q.q ?? '',
                options: Array.isArray(q.options) ? q.options : ['', '', '', ''],
                correctIndex:
                    typeof q.correctIndex === 'number' ? q.correctIndex : 0,
                explanation: q.explanation ?? '',
            })),
        );
        // optional: scroll to top
        window.scrollTo?.({ top: 0, behavior: 'smooth' });
    };

    const isEditing = !!editingId;

    return (
        <div style={{ padding: 16 }}>
            <h2>PYQ MCQ Papers (Year-wise)</h2>

            {/* Mode indicator */}
            {isEditing ? (
                <p style={{ color: '#2563EB', marginBottom: 4 }}>
                    ✏️ Editing paper: <strong>{title || `${exam} ${year}`}</strong>{' '}
                    (<button
                        type="button"
                        onClick={resetForm}
                        style={{
                            border: 'none',
                            background: 'none',
                            color: '#DC2626',
                            cursor: 'pointer',
                            textDecoration: 'underline',
                            padding: 0,
                            marginLeft: 4,
                        }}
                    >
                        cancel edit
                    </button>)
                </p>
            ) : (
                <p style={{ color: '#6B7280', marginBottom: 4 }}>
                    ➕ Create a new PYQ paper
                </p>
            )}

            {/* Form */}
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr 2fr auto',
                    gap: 8,
                    marginBottom: 12,
                    alignItems: 'center',
                }}
            >
                <input
                    placeholder="Exam (e.g. NEET)"
                    value={exam}
                    onChange={e => setExam(e.target.value)}
                />
                <input
                    type="number"
                    placeholder="Year (e.g. 2023)"
                    value={year}
                    onChange={e =>
                        setYear(e.target.value ? Number(e.target.value) : '')
                    }
                />
                <input
                    placeholder="Paper title (optional)"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                />
                <button onClick={addQuestion}>+ Add Question</button>
            </div>

            {/* Questions editor */}
            {questions.length > 0 && (
                <div
                    style={{
                        border: '1px solid #eee',
                        borderRadius: 8,
                        padding: 10,
                        marginBottom: 12,
                    }}
                >
                    <h4>Questions ({questions.length})</h4>
                    <small>
                        Options format: <code>A|B|C|D</code> (use | as separator)
                    </small>

                    {questions.map((q, idx) => (
                        <div
                            key={q.id}
                            style={{
                                display: 'grid',
                                gridTemplateColumns: '2fr 3fr 100px 3fr auto',
                                gap: 6,
                                marginTop: 6,
                                alignItems: 'flex-start',
                            }}
                        >
                            {/* Question text */}
                            <textarea
                                placeholder={`Q${idx + 1} text`}
                                value={q.q}
                                onChange={e =>
                                    updateQuestionField(idx, 'q', e.target.value)
                                }
                                style={{ minHeight: 40, resize: 'vertical' }}
                            />

                            {/* Options */}
                            <input
                                placeholder="Options A|B|C|D"
                                value={q.options?.join('|') ?? ''}
                                onChange={e => updateOptions(idx, e.target.value)}
                            />

                            {/* Correct index */}
                            <input
                                type="number"
                                min={0}
                                max={3}
                                placeholder="Correct index"
                                value={q.correctIndex ?? 0}
                                onChange={e =>
                                    updateQuestionField(
                                        idx,
                                        'correctIndex',
                                        Number(e.target.value) || 0,
                                    )
                                }
                                style={{ width: '100%' }}
                            />

                            {/* Explanation */}
                            <textarea
                                placeholder="Explanation (optional)"
                                value={q.explanation ?? ''}
                                onChange={e =>
                                    updateQuestionField(idx, 'explanation', e.target.value)
                                }
                                style={{ minHeight: 40, resize: 'vertical' }}
                            />

                            {/* Remove */}
                            <button onClick={() => removeQuestion(idx)}>✕</button>
                        </div>
                    ))}
                </div>
            )}

            <button
                onClick={savePaper}
                disabled={!year || !exam || questions.length === 0}
            >
                {isEditing ? 'Update PYQ Paper' : 'Save PYQ Paper'}
            </button>

            <hr style={{ margin: '24px 0' }} />

            {/* Existing papers table */}
            <h3>Existing PYQ MCQ Papers</h3>
            <table
                width="100%"
                cellPadding={8}
                style={{ borderCollapse: 'collapse', marginTop: 8 }}
            >
                <thead>
                    <tr>
                        <th align="left">Exam</th>
                        <th>Year</th>
                        <th align="left">Title</th>
                        <th>Questions</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {papers.map(p => (
                        <tr key={p.id} style={{ borderTop: '1px solid #eee' }}>
                            <td>{p.exam}</td>
                            <td align="center">{p.year}</td>
                            <td>{p.title}</td>
                            <td align="center">{p.questions?.length ?? 0}</td>
                            <td align="center" style={{ whiteSpace: 'nowrap' }}>
                                <button
                                    onClick={() => startEditPaper(p)}
                                    style={{ marginRight: 8 }}
                                >
                                    Edit
                                </button>
                                <button
                                    onClick={() => removePaper(p.id)}
                                    style={{ color: 'crimson' }}
                                >
                                    Delete
                                </button>
                            </td>
                        </tr>
                    ))}
                    {!papers.length && (
                        <tr>
                            <td colSpan={5} style={{ paddingTop: 12, color: '#777' }}>
                                No PYQ papers added yet.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}
