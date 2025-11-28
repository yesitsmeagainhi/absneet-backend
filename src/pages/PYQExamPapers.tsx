// src/admin/PYQFullExamPdfPapersPage.tsx
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
} from 'firebase/firestore';

type FullExamPdf = {
    id?: string;
    exam: string;
    year: number;
    title: string;
    pdfUrl: string;
};

const col = collection(db, 'nodes');

export default function PYQFullExamPdfPapersPage() {
    const [papers, setPapers] = useState<FullExamPdf[]>([]);

    const [exam, setExam] = useState('NEET');
    const [year, setYear] = useState<number | ''>('');
    const [title, setTitle] = useState('');
    const [pdfUrl, setPdfUrl] = useState('');

    const loadPapers = async () => {
        const q = query(col, orderBy('year', 'desc'));
        const snap = await getDocs(q);
        const list: FullExamPdf[] = snap.docs.map(d => {
            const data = d.data() as any;
            return {
                id: d.id,
                exam: data.exam ?? 'NEET',
                year: data.year ?? 0,
                title: data.title ?? '',
                pdfUrl: data.pdfUrl ?? '',
            };
        });
        setPapers(list);
    };

    useEffect(() => {
        loadPapers();
    }, []);

    const addPaper = async () => {
        if (!exam.trim() || !year || !pdfUrl.trim()) {
            alert('Please fill Exam, Year and PDF URL.');
            return;
        }

        const payload: Omit<FullExamPdf, 'id'> = {
            exam: exam.trim(),
            year: Number(year),
            title: title.trim() || `${exam} ${year} Full Question Paper`,
            pdfUrl: pdfUrl.trim(),
        };

        await addDoc(col, {
            ...payload,
            createdAt: serverTimestamp(),
        });

        setYear('');
        setTitle('');
        setPdfUrl('');
        await loadPapers();
    };

    const removePaper = async (id?: string) => {
        if (!id) return;
        if (!window.confirm('Delete this full exam paper PDF?')) return;
        await deleteDoc(doc(db, 'pyqFullExamPapers', id));
        await loadPapers();
    };

    return (
        <div style={{ padding: 16 }}>
            <h2>PYQ Full Exam PDF Papers</h2>

            {/* Form */}
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 0.6fr 2fr auto',
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
                <input
                    placeholder="PDF URL"
                    value={pdfUrl}
                    onChange={e => setPdfUrl(e.target.value)}
                    style={{ gridColumn: '1 / span 3' }}
                />
                <button onClick={addPaper}>+ Add Full Exam PDF</button>
            </div>

            <hr style={{ margin: '16px 0' }} />

            {/* Existing papers */}
            <h3>Existing Full Exam PDFs</h3>
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
                        <th align="left">PDF URL</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {papers.map(p => (
                        <tr key={p.id} style={{ borderTop: '1px solid #eee' }}>
                            <td>{p.exam}</td>
                            <td align="center">{p.year}</td>
                            <td>{p.title}</td>
                            <td style={{ maxWidth: 280, wordBreak: 'break-all' }}>
                                {p.pdfUrl}
                            </td>
                            <td align="center">
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
                                No full exam PDF papers added yet.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}
