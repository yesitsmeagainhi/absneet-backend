import React, { useEffect, useState } from 'react';
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
} from 'firebase/firestore';
import { db } from '../firebase'; // ✅ adjust path if needed
import type { Timestamp } from 'firebase/firestore';

type NewsDoc = {
    id: string;
    title: string;
    subtitle?: string;
    excerpt?: string;
    summary?: string;
    content?: string;
    coverUrl?: string;
    bannerUrl?: string;
    author?: string;
    createdAt?: Timestamp | null;
    published: boolean;
};

const ACCENT = '#6D28D9';

export default function NewsAdminPage() {
    const [items, setItems] = useState<NewsDoc[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [editingId, setEditingId] = useState<string | null>(null);

    // form state
    const [title, setTitle] = useState('');
    const [subtitle, setSubtitle] = useState('');
    const [excerpt, setExcerpt] = useState('');
    const [summary, setSummary] = useState('');
    const [content, setContent] = useState('');
    const [coverUrl, setCoverUrl] = useState('');
    const [bannerUrl, setBannerUrl] = useState('');
    const [author, setAuthor] = useState('');
    const [published, setPublished] = useState(true);

    // 🔹 load list
    const load = async () => {
        setLoading(true);
        setError(null);
        try {
            const q = query(
                collection(db, 'news'),
                orderBy('createdAt', 'desc'),
            );
            const snap = await getDocs(q);
            const rows: NewsDoc[] = snap.docs.map(d => {
                const data = d.data() as any;
                return {
                    id: d.id,
                    title: data.title ?? '',
                    subtitle: data.subtitle ?? '',
                    excerpt: data.excerpt ?? data.summary ?? '',
                    summary: data.summary ?? '',
                    content: data.content ?? '',
                    coverUrl: data.coverUrl ?? data.bannerUrl ?? '',
                    bannerUrl: data.bannerUrl ?? '',
                    author: data.author ?? '',
                    createdAt: data.createdAt ?? null,
                    published: !!data.published,
                };
            });
            setItems(rows);
        } catch (e: any) {
            console.error('[news-admin] load error:', e);
            setError(e?.message || 'Failed to load news');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, []);

    const resetForm = () => {
        setEditingId(null);
        setTitle('');
        setSubtitle('');
        setExcerpt('');
        setSummary('');
        setContent('');
        setCoverUrl('');
        setBannerUrl('');
        setAuthor('');
        setPublished(true);
    };

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) {
            alert('Title is required');
            return;
        }

        setSaving(true);
        setError(null);

        try {
            if (editingId) {
                // update existing
                const ref = doc(db, 'news', editingId);
                await updateDoc(ref, {
                    title: title.trim(),
                    subtitle: subtitle.trim(),
                    excerpt: excerpt.trim(),
                    summary: summary.trim(),
                    content: content.trim(),
                    coverUrl: coverUrl.trim(),
                    bannerUrl: bannerUrl.trim(),
                    author: author.trim(),
                    published,
                    // ⚠ do NOT change createdAt, RN relies on original order
                });
            } else {
                // create new
                await addDoc(collection(db, 'news'), {
                    title: title.trim(),
                    subtitle: subtitle.trim(),
                    excerpt: excerpt.trim(),
                    summary: summary.trim(),
                    content: content.trim(),
                    coverUrl: coverUrl.trim(),
                    bannerUrl: bannerUrl.trim(),
                    author: author.trim(),
                    published,
                    createdAt: serverTimestamp(),
                });
            }

            await load();
            resetForm();
        } catch (e: any) {
            console.error('[news-admin] save error:', e);
            setError(e?.message || 'Failed to save news');
        } finally {
            setSaving(false);
        }
    };

    const onEdit = (item: NewsDoc) => {
        setEditingId(item.id);
        setTitle(item.title || '');
        setSubtitle(item.subtitle || '');
        setExcerpt(item.excerpt || '');
        setSummary(item.summary || '');
        setContent(item.content || '');
        setCoverUrl(item.coverUrl || '');
        setBannerUrl(item.bannerUrl || '');
        setAuthor(item.author || '');
        setPublished(!!item.published);
    };

    const onDelete = async (id: string) => {
        if (!window.confirm('Delete this news item?')) return;
        try {
            await deleteDoc(doc(db, 'news', id));
            setItems(prev => prev.filter(it => it.id !== id));
            if (editingId === id) resetForm();
        } catch (e: any) {
            console.error('[news-admin] delete error:', e);
            alert(e?.message || 'Failed to delete');
        }
    };

    const onCancelEdit = () => {
        resetForm();
    };

    return (
        <div
            style={{
                minHeight: '100vh',
                display: 'flex',
                flexDirection: 'column',
                padding: '24px',
                background: '#0b1220',
                color: '#e5e7eb',
                fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
            }}
        >
            <div
                style={{
                    maxWidth: 1100,
                    width: '100%',
                    margin: '0 auto',
                }}
            >
                {/* Header */}
                <header
                    style={{
                        marginBottom: 24,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                    }}
                >
                    <div>
                        <div
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                padding: '4px 10px',
                                borderRadius: 999,
                                background: '#111827',
                                fontSize: 12,
                                color: ACCENT,
                                marginBottom: 6,
                            }}
                        >
                            ABS Admin · News
                        </div>
                        <h1
                            style={{
                                margin: 0,
                                fontSize: 24,
                                fontWeight: 800,
                            }}
                        >
                            News & Updates Manager
                        </h1>
                        <p
                            style={{
                                marginTop: 6,
                                fontSize: 13,
                                color: '#9ca3af',
                            }}
                        >
                            Add and manage news posts that will appear in the ABS NEET app.
                        </p>
                    </div>
                </header>

                {/* Main layout */}
                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 3fr)',
                        gap: 24,
                        alignItems: 'flex-start',
                    }}
                >
                    {/* Form */}
                    <section
                        style={{
                            background: '#020617',
                            borderRadius: 16,
                            padding: 16,
                            border: '1px solid #1f2937',
                        }}
                    >
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: 10,
                            }}
                        >
                            <h2
                                style={{
                                    margin: 0,
                                    fontSize: 16,
                                    fontWeight: 600,
                                }}
                            >
                                {editingId ? 'Edit news post' : 'Create news post'}
                            </h2>
                            {editingId && (
                                <button
                                    onClick={onCancelEdit}
                                    type="button"
                                    style={{
                                        border: 'none',
                                        background: 'transparent',
                                        color: '#9ca3af',
                                        fontSize: 12,
                                        cursor: 'pointer',
                                        textDecoration: 'underline',
                                    }}
                                >
                                    Cancel edit
                                </button>
                            )}
                        </div>

                        {error && (
                            <div
                                style={{
                                    padding: 8,
                                    borderRadius: 8,
                                    background: '#7f1d1d',
                                    fontSize: 12,
                                    marginBottom: 10,
                                }}
                            >
                                {error}
                            </div>
                        )}

                        <form onSubmit={onSubmit}>
                            {/* Title */}
                            <div style={{ marginBottom: 10 }}>
                                <label style={labelStyle}>
                                    Title <span style={{ color: '#f97373' }}>*</span>
                                </label>
                                <input
                                    value={title}
                                    onChange={e => setTitle(e.target.value)}
                                    style={inputStyle}
                                    placeholder="Example: NEET Mock Test Series – New Schedule"
                                />
                            </div>

                            {/* Subtitle */}
                            <div style={{ marginBottom: 10 }}>
                                <label style={labelStyle}>Subtitle</label>
                                <input
                                    value={subtitle}
                                    onChange={e => setSubtitle(e.target.value)}
                                    style={inputStyle}
                                    placeholder="Example: Attempt full-length mocks and boost your score."
                                />
                            </div>

                            {/* Excerpt */}
                            <div style={{ marginBottom: 10 }}>
                                <label style={labelStyle}>Short excerpt</label>
                                <textarea
                                    value={excerpt}
                                    onChange={e => setExcerpt(e.target.value)}
                                    style={textareaStyle}
                                    rows={2}
                                    placeholder="Short preview text visible in the card on the app."
                                />
                            </div>

                            {/* Summary */}
                            <div style={{ marginBottom: 10 }}>
                                <label style={labelStyle}>Summary</label>
                                <textarea
                                    value={summary}
                                    onChange={e => setSummary(e.target.value)}
                                    style={textareaStyle}
                                    rows={3}
                                    placeholder="Optional summary (used if no excerpt is provided)."
                                />
                            </div>

                            {/* Content */}
                            <div style={{ marginBottom: 10 }}>
                                <label style={labelStyle}>Full content</label>
                                <textarea
                                    value={content}
                                    onChange={e => setContent(e.target.value)}
                                    style={{ ...textareaStyle, minHeight: 120 }}
                                    placeholder="Detailed news content shown when user expands the card."
                                />
                            </div>

                            {/* Images */}
                            <div style={{ marginBottom: 10 }}>
                                <label style={labelStyle}>Cover URL</label>
                                <input
                                    value={coverUrl}
                                    onChange={e => setCoverUrl(e.target.value)}
                                    style={inputStyle}
                                    placeholder="https://..."
                                />
                                <small style={{ color: '#6b7280', fontSize: 11 }}>
                                    Shown as main image in the card (should be a valid HTTPS URL).
                                </small>
                            </div>

                            <div style={{ marginBottom: 10 }}>
                                <label style={labelStyle}>Banner URL (optional)</label>
                                <input
                                    value={bannerUrl}
                                    onChange={e => setBannerUrl(e.target.value)}
                                    style={inputStyle}
                                    placeholder="https://..."
                                />
                            </div>

                            {/* Author & published */}
                            <div
                                style={{
                                    display: 'flex',
                                    gap: 10,
                                    marginBottom: 12,
                                }}
                            >
                                <div style={{ flex: 1 }}>
                                    <label style={labelStyle}>Author</label>
                                    <input
                                        value={author}
                                        onChange={e => setAuthor(e.target.value)}
                                        style={inputStyle}
                                        placeholder="ABS Team"
                                    />
                                </div>

                                <div
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        marginTop: 22,
                                        gap: 6,
                                    }}
                                >
                                    <input
                                        id="publishedChk"
                                        type="checkbox"
                                        checked={published}
                                        onChange={e => setPublished(e.target.checked)}
                                    />
                                    <label htmlFor="publishedChk" style={{ fontSize: 13 }}>
                                        Published
                                    </label>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={saving}
                                style={{
                                    marginTop: 4,
                                    padding: '8px 16px',
                                    borderRadius: 999,
                                    border: 'none',
                                    cursor: saving ? 'wait' : 'pointer',
                                    background: ACCENT,
                                    color: '#f9fafb',
                                    fontWeight: 600,
                                    fontSize: 13,
                                }}
                            >
                                {saving
                                    ? editingId
                                        ? 'Saving changes...'
                                        : 'Creating...'
                                    : editingId
                                        ? 'Save changes'
                                        : 'Create news'}
                            </button>
                        </form>
                    </section>

                    {/* List */}
                    <section
                        style={{
                            background: '#020617',
                            borderRadius: 16,
                            padding: 16,
                            border: '1px solid #1f2937',
                        }}
                    >
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: 10,
                            }}
                        >
                            <h2
                                style={{
                                    margin: 0,
                                    fontSize: 16,
                                    fontWeight: 600,
                                }}
                            >
                                Latest news
                            </h2>
                            <span
                                style={{
                                    fontSize: 12,
                                    color: '#9ca3af',
                                }}
                            >
                                {loading ? 'Loading...' : `${items.length} posts`}
                            </span>
                        </div>

                        {loading ? (
                            <p style={{ fontSize: 13, color: '#9ca3af' }}>
                                Loading news from Firestore...
                            </p>
                        ) : items.length === 0 ? (
                            <p style={{ fontSize: 13, color: '#9ca3af' }}>
                                No news posts yet. Add a new one using the form.
                            </p>
                        ) : (
                            <div
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 10,
                                    maxHeight: '75vh',
                                    overflowY: 'auto',
                                }}
                            >
                                {items.map(item => {
                                    const when =
                                        item.createdAt && 'toDate' in item.createdAt
                                            ? item.createdAt.toDate().toLocaleString()
                                            : 'Not set';

                                    return (
                                        <div
                                            key={item.id}
                                            style={{
                                                borderRadius: 12,
                                                border: '1px solid #1f2937',
                                                padding: 10,
                                                background: item.published ? '#020617' : '#111827',
                                            }}
                                        >
                                            <div
                                                style={{
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'flex-start',
                                                    gap: 10,
                                                }}
                                            >
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <div
                                                        style={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: 6,
                                                            marginBottom: 4,
                                                        }}
                                                    >
                                                        <span
                                                            style={{
                                                                fontSize: 11,
                                                                padding: '2px 8px',
                                                                borderRadius: 999,
                                                                background: item.published
                                                                    ? '#064e3b'
                                                                    : '#7f1d1d',
                                                                color: '#d1fae5',
                                                            }}
                                                        >
                                                            {item.published ? 'Published' : 'Draft'}
                                                        </span>
                                                        <span
                                                            style={{
                                                                fontSize: 11,
                                                                color: '#9ca3af',
                                                            }}
                                                        >
                                                            {when}
                                                        </span>
                                                    </div>
                                                    <div
                                                        style={{
                                                            fontSize: 14,
                                                            fontWeight: 600,
                                                            marginBottom: 2,
                                                            whiteSpace: 'nowrap',
                                                            overflow: 'hidden',
                                                            textOverflow: 'ellipsis',
                                                        }}
                                                    >
                                                        {item.title || '(untitled)'}
                                                    </div>
                                                    {item.subtitle && (
                                                        <div
                                                            style={{
                                                                fontSize: 12,
                                                                color: '#9ca3af',
                                                                whiteSpace: 'nowrap',
                                                                overflow: 'hidden',
                                                                textOverflow: 'ellipsis',
                                                            }}
                                                        >
                                                            {item.subtitle}
                                                        </div>
                                                    )}
                                                    {item.author && (
                                                        <div
                                                            style={{
                                                                marginTop: 4,
                                                                fontSize: 11,
                                                                color: '#6b7280',
                                                            }}
                                                        >
                                                            By {item.author}
                                                        </div>
                                                    )}
                                                </div>

                                                <div
                                                    style={{
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        gap: 4,
                                                    }}
                                                >
                                                    <button
                                                        type="button"
                                                        onClick={() => onEdit(item)}
                                                        style={smallBtnStyle}
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => onDelete(item.id)}
                                                        style={{
                                                            ...smallBtnStyle,
                                                            background: '#7f1d1d',
                                                        }}
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </section>
                </div>
            </div>
        </div>
    );
}

// ✅ small inline style helpers
const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: 12,
    marginBottom: 4,
    color: '#d1d5db',
};

const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '6px 8px',
    borderRadius: 8,
    border: '1px solid #374151',
    background: '#020617',
    color: '#e5e7eb',
    fontSize: 13,
    outline: 'none',
};

const textareaStyle: React.CSSProperties = {
    ...inputStyle,
    resize: 'vertical',
};

const smallBtnStyle: React.CSSProperties = {
    border: 'none',
    borderRadius: 999,
    padding: '4px 10px',
    fontSize: 11,
    cursor: 'pointer',
    background: '#1f2937',
    color: '#e5e7eb',
};
