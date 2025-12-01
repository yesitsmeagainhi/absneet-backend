// src/components/MockTestAdmin.tsx
import React, { useEffect, useMemo, useState } from 'react';
import {
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  orderBy,
  query,
} from 'firebase/firestore';
import { db } from '../firebase';
import type {
  FullExamPdfDoc,
  SubjectMockPdfDoc,
  SubjectWithMockPapers,
} from '../types';

type Tab = 'full' | 'subject';

const fullExamCol = collection(db, 'nodes');
const subjectMocksCol = collection(db, 'nodes');

const ACCENT = '#2563EB';

export default function MockTestAdmin() {
  const [activeTab, setActiveTab] = useState<Tab>('full');

  return (
    <div style={styles.page}>
      <h1 style={styles.pageTitle}>Mock Test Papers Admin</h1>
      <p style={styles.pageSub}>
        Manage NEET mock test PDFs stored in Firestore for your mobile app.
      </p>

      {/* Tabs */}
      <div style={styles.tabsRow}>
        <button
          type="button"
          style={{
            ...styles.tabButton,
            ...(activeTab === 'full' ? styles.tabButtonActive : {}),
          }}
          onClick={() => setActiveTab('full')}
        >
          Full Exam Papers
        </button>
        <button
          type="button"
          style={{
            ...styles.tabButton,
            ...(activeTab === 'subject' ? styles.tabButtonActive : {}),
          }}
          onClick={() => setActiveTab('subject')}
        >
          Subject-wise Papers
        </button>
      </div>

      {activeTab === 'full' ? <FullExamAdmin /> : <SubjectMocksAdmin />}
    </div>
  );
}

/* ---------- Full Exam Admin ---------- */

function FullExamAdmin() {
  const [items, setItems] = useState<FullExamPdfDoc[]>([]);
  const [loading, setLoading] = useState(false);
  const [exam, setExam] = useState('NEET');
  const [year, setYear] = useState<string>(new Date().getFullYear().toString());
  const [title, setTitle] = useState('');
  const [pdfUrl, setPdfUrl] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [filterYear, setFilterYear] = useState<string>('');

  const filteredItems = useMemo(() => {
    if (!filterYear.trim()) return items;
    const y = Number(filterYear);
    if (Number.isNaN(y)) return items;
    return items.filter(i => i.year === y);
  }, [items, filterYear]);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const q = query(fullExamCol, orderBy('year', 'desc'));
      const snap = await getDocs(q);
      const list: FullExamPdfDoc[] = snap.docs.map(d => {
        const data = d.data() as any;
        return {
          id: d.id,
          exam: data.exam ?? 'NEET',
          year: data.year ?? 0,
          title:
            data.title ??
            `${data.exam ?? 'NEET'} ${data.year ?? ''} Full Mock Test`,
          pdfUrl: data.pdfUrl ?? '',
        };
      });
      setItems(list);
    } catch (e: any) {
      console.error('[FullExamAdmin] load error', e);
      setError('Failed to load full exam mock papers.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const yearNum = Number(year);
    if (!title.trim() || !pdfUrl.trim() || Number.isNaN(yearNum)) {
      setError('Please enter a valid title, year and PDF URL.');
      return;
    }

    try {
      await addDoc(fullExamCol, {
        exam: exam.trim() || 'NEET',
        year: yearNum,
        title: title.trim(),
        pdfUrl: pdfUrl.trim(),
      });
      setTitle('');
      setPdfUrl('');
      setYear(new Date().getFullYear().toString());
      await load();
    } catch (e: any) {
      console.error('[FullExamAdmin] add error', e);
      setError('Failed to add paper. Check console for details.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this paper?')) return;
    try {
      await deleteDoc(doc(fullExamCol, id));
      setItems(prev => prev.filter(p => p.id !== id));
    } catch (e: any) {
      console.error('[FullExamAdmin] delete error', e);
      alert('Failed to delete. Check console.');
    }
  };

  return (
    <div style={styles.sectionCard}>
      <h2 style={styles.sectionTitle}>Complete Mock Exam (All Subjects)</h2>
      <p style={styles.sectionSub}>
        These PDFs are used by the mobile app for the “Complete Exam (All Subjects Combined)” section.
      </p>

      {/* Add form */}
      <form style={styles.form} onSubmit={handleAdd}>
        <div style={styles.formRow}>
          <label style={styles.label}>
            Exam
            <input
              style={styles.input}
              value={exam}
              onChange={e => setExam(e.target.value)}
              placeholder="NEET"
            />
          </label>
          <label style={styles.label}>
            Year
            <input
              style={styles.input}
              value={year}
              onChange={e => setYear(e.target.value)}
              placeholder="2025"
              type="number"
            />
          </label>
        </div>

        <label style={styles.label}>
          Title
          <input
            style={styles.input}
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="NEET 2024 Full Mock Test 1"
          />
        </label>

        <label style={styles.label}>
          PDF URL
          <input
            style={styles.input}
            value={pdfUrl}
            onChange={e => setPdfUrl(e.target.value)}
            placeholder="https://..."
          />
        </label>

        <button type="submit" style={styles.primaryButton}>
          + Add Full Exam PDF
        </button>

        {error && <p style={styles.errorText}>{error}</p>}
      </form>

      {/* Filter by year */}
      <div style={styles.filterRow}>
        <label style={styles.labelInline}>
          Filter by year:
          <input
            style={{ ...styles.input, maxWidth: 120, marginLeft: 8 }}
            value={filterYear}
            onChange={e => setFilterYear(e.target.value)}
            placeholder="e.g. 2024"
            type="number"
          />
        </label>
        <button
          type="button"
          style={styles.secondaryButton}
          onClick={() => setFilterYear('')}
        >
          Clear
        </button>
      </div>

      {/* List */}
      {loading ? (
        <p>Loading…</p>
      ) : filteredItems.length === 0 ? (
        <p style={styles.mutedText}>No papers found for this filter.</p>
      ) : (
        <div style={styles.list}>
          {filteredItems.map(p => (
            <div key={p.id} style={styles.listItem}>
              <div style={{ flex: 1 }}>
                <div style={styles.itemTitle}>{p.title}</div>
                <div style={styles.itemMeta}>
                  {p.exam} • {p.year}
                </div>
                <button
                  type="button"
                  style={styles.linkButton}
                  onClick={() => window.open(p.pdfUrl, '_blank')}
                >
                  Open PDF
                </button>
              </div>
              <button
                type="button"
                style={styles.dangerButton}
                onClick={() => handleDelete(p.id)}
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------- Subject-wise Admin ---------- */

function SubjectMocksAdmin() {
  const [items, setItems] = useState<SubjectWithMockPapers[]>([]);
  const [loading, setLoading] = useState(false);

  const [subjectId, setSubjectId] = useState('phy');
  const [subjectName, setSubjectName] = useState('Physics');
  const [exam, setExam] = useState('NEET');
  const [year, setYear] = useState<string>(new Date().getFullYear().toString());
  const [title, setTitle] = useState('');
  const [pdfUrl, setPdfUrl] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [filterYear, setFilterYear] = useState<string>('');

  const load = async () => {
    try {
      setLoading(true);
      setError(null);

      const q = query(subjectMocksCol, orderBy('year', 'desc'));
      const snap = await getDocs(q);

      const subjectDocs: SubjectMockPdfDoc[] = snap.docs.map(d => {
        const data = d.data() as any;
        return {
          id: d.id,
          subjectId: data.subjectId ?? 'general',
          subjectName: data.subjectName,
          exam: data.exam ?? 'NEET',
          year: data.year ?? 0,
          title:
            data.title ??
            `${data.exam ?? 'NEET'} ${data.year ?? ''} Subject Mock`,
          pdfUrl: data.pdfUrl ?? '',
        };
      });

      const bySub: Record<string, SubjectWithMockPapers> = {};
      subjectDocs.forEach(p => {
        if (!bySub[p.subjectId]) {
          bySub[p.subjectId] = {
            subjectId: p.subjectId,
            subjectName: p.subjectName || p.subjectId.toUpperCase(),
            papers: [],
          };
        }
        bySub[p.subjectId].papers.push(p);
      });

      const grouped = Object.values(bySub).map(s => ({
        ...s,
        papers: [...s.papers].sort((a, b) => b.year - a.year),
      }));

      setItems(grouped);
    } catch (e: any) {
      console.error('[SubjectMocksAdmin] load error', e);
      setError('Failed to load subject-wise mock papers.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const yearNum = Number(year);
    if (
      !subjectId.trim() ||
      !subjectName.trim() ||
      !title.trim() ||
      !pdfUrl.trim() ||
      Number.isNaN(yearNum)
    ) {
      setError('Please fill all fields with valid data.');
      return;
    }

    try {
      await addDoc(subjectMocksCol, {
        subjectId: subjectId.trim(),
        subjectName: subjectName.trim(),
        exam: exam.trim() || 'NEET',
        year: yearNum,
        title: title.trim(),
        pdfUrl: pdfUrl.trim(),
      });

      setTitle('');
      setPdfUrl('');
      await load();
    } catch (e: any) {
      console.error('[SubjectMocksAdmin] add error', e);
      setError('Failed to add subject-wise paper. Check console for details.');
    }
  };

  const handleDelete = async (subjectId: string, id: string) => {
    if (!window.confirm('Delete this paper?')) return;
    try {
      await deleteDoc(doc(subjectMocksCol, id));
      setItems(prev =>
        prev.map(s =>
          s.subjectId === subjectId
            ? { ...s, papers: s.papers.filter(p => p.id !== id) }
            : s,
        ),
      );
    } catch (e: any) {
      console.error('[SubjectMocksAdmin] delete error', e);
      alert('Failed to delete. Check console.');
    }
  };

  const filteredItems: SubjectWithMockPapers[] = useMemo(() => {
    if (!filterYear.trim()) return items;
    const y = Number(filterYear);
    if (Number.isNaN(y)) return items;
    return items
      .map(group => ({
        ...group,
        papers: group.papers.filter(p => p.year === y),
      }))
      .filter(group => group.papers.length > 0);
  }, [items, filterYear]);

  return (
    <div style={styles.sectionCard}>
      <h2 style={styles.sectionTitle}>Subject-wise Mock Papers</h2>
      <p style={styles.sectionSub}>
        These PDFs are used by the mobile app for subject-wise practice (Physics, Chemistry, etc.).
      </p>

      {/* Add form */}
      <form style={styles.form} onSubmit={handleAdd}>
        <div style={styles.formRow}>
          <label style={styles.label}>
            Subject ID
            <input
              style={styles.input}
              value={subjectId}
              onChange={e => setSubjectId(e.target.value)}
              placeholder="phy / chem / bio"
            />
          </label>
          <label style={styles.label}>
            Subject Name
            <input
              style={styles.input}
              value={subjectName}
              onChange={e => setSubjectName(e.target.value)}
              placeholder="Physics"
            />
          </label>
        </div>

        <div style={styles.formRow}>
          <label style={styles.label}>
            Exam
            <input
              style={styles.input}
              value={exam}
              onChange={e => setExam(e.target.value)}
              placeholder="NEET"
            />
          </label>
          <label style={styles.label}>
            Year
            <input
              style={styles.input}
              value={year}
              onChange={e => setYear(e.target.value)}
              placeholder="2025"
              type="number"
            />
          </label>
        </div>

        <label style={styles.label}>
          Title
          <input
            style={styles.input}
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Physics Mock Test 1 (2024)"
          />
        </label>

        <label style={styles.label}>
          PDF URL
          <input
            style={styles.input}
            value={pdfUrl}
            onChange={e => setPdfUrl(e.target.value)}
            placeholder="https://..."
          />
        </label>

        <button type="submit" style={styles.primaryButton}>
          + Add Subject-wise PDF
        </button>

        {error && <p style={styles.errorText}>{error}</p>}
      </form>

      {/* Filter by year */}
      <div style={styles.filterRow}>
        <label style={styles.labelInline}>
          Filter by year:
          <input
            style={{ ...styles.input, maxWidth: 120, marginLeft: 8 }}
            value={filterYear}
            onChange={e => setFilterYear(e.target.value)}
            placeholder="e.g. 2024"
            type="number"
          />
        </label>
        <button
          type="button"
          style={styles.secondaryButton}
          onClick={() => setFilterYear('')}
        >
          Clear
        </button>
      </div>

      {/* List */}
      {loading ? (
        <p>Loading…</p>
      ) : filteredItems.length === 0 ? (
        <p style={styles.mutedText}>No subject-wise papers found for this filter.</p>
      ) : (
        <div style={styles.list}>
          {filteredItems.map(group => (
            <div key={group.subjectId} style={styles.subjectGroup}>
              <h3 style={styles.subjectHeading}>{group.subjectName}</h3>
              {group.papers.map(paper => (
                <div key={paper.id} style={styles.listItem}>
                  <div style={{ flex: 1 }}>
                    <div style={styles.itemTitle}>{paper.title}</div>
                    <div style={styles.itemMeta}>
                      {paper.exam} • {paper.year}
                    </div>
                    <button
                      type="button"
                      style={styles.linkButton}
                      onClick={() => window.open(paper.pdfUrl, '_blank')}
                    >
                      Open PDF
                    </button>
                  </div>
                  <button
                    type="button"
                    style={styles.dangerButton}
                    onClick={() => handleDelete(group.subjectId, paper.id)}
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------- Simple inline “styles” object for React web ---------- */

const styles: Record<string, React.CSSProperties> = {
  page: {
    maxWidth: 900,
    margin: '24px auto',
    padding: 16,
    fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: 700,
    marginBottom: 4,
  },
  pageSub: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
  tabsRow: {
    display: 'flex',
    gap: 8,
    marginBottom: 16,
  },
  tabButton: {
    flex: 1,
    padding: '8px 12px',
    borderRadius: 999,
    border: '1px solid #E5E7EB',
    backgroundColor: '#FFFFFF',
    cursor: 'pointer',
    fontSize: 14,
  },
  tabButtonActive: {
    borderColor: ACCENT,
    backgroundColor: '#EFF6FF',
    color: ACCENT,
    fontWeight: 600,
  },
  sectionCard: {
    borderRadius: 12,
    border: '1px solid #E5E7EB',
    padding: 16,
    backgroundColor: '#FFFFFF',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 600,
    marginBottom: 4,
  },
  sectionSub: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 16,
  },
  form: {
    marginBottom: 16,
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  formRow: {
    display: 'flex',
    gap: 8,
  },
  label: {
    flex: 1,
    fontSize: 12,
    fontWeight: 500,
    color: '#374151',
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  input: {
    padding: '6px 8px',
    borderRadius: 6,
    border: '1px solid #D1D5DB',
    fontSize: 13,
  },
  primaryButton: {
    marginTop: 4,
    alignSelf: 'flex-start',
    padding: '8px 14px',
    borderRadius: 999,
    border: 'none',
    backgroundColor: ACCENT,
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
  },
  secondaryButton: {
    padding: '6px 12px',
    borderRadius: 999,
    border: '1px solid #D1D5DB',
    backgroundColor: '#FFFFFF',
    fontSize: 13,
    cursor: 'pointer',
  },
  dangerButton: {
    padding: '6px 12px',
    borderRadius: 999,
    border: 'none',
    backgroundColor: '#EF4444',
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
    marginLeft: 8,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 12,
    marginTop: 4,
  },
  filterRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  labelInline: {
    fontSize: 12,
    color: '#374151',
    display: 'flex',
    alignItems: 'center',
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  listItem: {
    display: 'flex',
    alignItems: 'center',
    padding: 10,
    borderRadius: 10,
    border: '1px solid #E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: 500,
  },
  itemMeta: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  linkButton: {
    padding: 0,
    border: 'none',
    background: 'none',
    color: ACCENT,
    fontSize: 12,
    cursor: 'pointer',
    textDecoration: 'underline',
  },
  mutedText: {
    fontSize: 13,
    color: '#9CA3AF',
  },
  subjectGroup: {
    borderRadius: 10,
    border: '1px solid #E5E7EB',
    padding: 10,
    backgroundColor: '#F9FAFB',
  },
  subjectHeading: {
    fontSize: 15,
    fontWeight: 600,
    marginBottom: 8,
  },
};
