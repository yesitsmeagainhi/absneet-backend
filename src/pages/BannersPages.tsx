// src/pages/BannersPage.tsx
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
    updateDoc, where
} from 'firebase/firestore';
import { db } from '../firebase';
import type { BannerDoc } from '../types';

const collectionName = 'nodes';

export default function BannersPage() {
    const [items, setItems] = useState<BannerDoc[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    // form state
    const [title, setTitle] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [link, setLink] = useState('');
    const [order, setOrder] = useState<number>(1);
    const [active, setActive] = useState(true);

    const [editingId, setEditingId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const load = async () => {
        try {
            setLoading(true);
            setError(null);

            const q = query(
                collection(db, collectionName),
                // only banner docs
                where('type', '==', 'banner'),
                orderBy('order', 'asc'),
            );

            const snap = await getDocs(q);

            const list: BannerDoc[] = snap.docs.map(d => {
                const data = d.data() as any;
                return {
                    id: d.id,
                    title: data.title ?? '',
                    imageUrl: data.imageUrl ?? '',
                    link: data.link ?? '',
                    order: data.order ?? 0,
                    active: data.active ?? true,
                    createdAt: data.createdAt ?? null,
                };
            });

            setItems(list);
            // default order = last + 1
            setOrder(list.length + 1);
        } catch (e: any) {
            console.error('[BannersPage] load error', e);
            setError(e?.message || 'Failed to load banners.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, []);

    const resetForm = () => {
        setTitle('');
        setImageUrl('');
        setLink('');
        setOrder(items.length + 1);
        setActive(true);
        setEditingId(null);
        setError(null);
    };

    const startEdit = (banner: BannerDoc) => {
        setEditingId(banner.id);
        setTitle(banner.title);
        setImageUrl(banner.imageUrl);
        setLink(banner.link);
        setOrder(banner.order);
        setActive(banner.active);
        setError(null);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!title.trim()) {
            setError('Title is required.');
            return;
        }
        if (!imageUrl.trim()) {
            setError('Image URL is required.');
            return;
        }
        if (!link.trim()) {
            setError('Link is required.');
            return;
        }

        try {
            setSaving(true);
            setError(null);

            if (editingId) {
                const ref = doc(db, collectionName, editingId);
                await updateDoc(ref, {
                    type: 'banner',
                    title: title.trim(),
                    imageUrl: imageUrl.trim(),
                    link: link.trim(),
                    order: Number(order) || 0,
                    active,
                });
            } else {
                await addDoc(collection(db, collectionName), {
                    type: 'banner',
                    title: title.trim(),
                    imageUrl: imageUrl.trim(),
                    link: link.trim(),
                    order: Number(order) || 0,
                    active,
                    createdAt: serverTimestamp(),
                });
            }

            await load();
            resetForm();
        } catch (e: any) {
            console.error('[BannersPage] save error', e);
            setError(e?.message || 'Failed to save banner.');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Delete this banner?')) return;

        try {
            await deleteDoc(doc(db, collectionName, id));
            await load();
        } catch (e: any) {
            console.error('[BannersPage] delete error', e);
            alert(e?.message || 'Failed to delete banner.');
        }
    };

    return (
        <div style={styles.page}>
            <div style={styles.header}>
                <h1 style={styles.title}>ABS NEET – Home Banners</h1>
                <p style={styles.subtitle}>
                    Create & manage home screen banner cards shown in the mobile app.
                </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSave} style={styles.card}>
                <h2 style={styles.cardTitle}>
                    {editingId ? 'Edit Banner' : 'Add New Banner'}
                </h2>

                {error && <div style={styles.errorBox}>{error}</div>}

                <div style={styles.fieldRow}>
                    <label style={styles.label}>Title</label>
                    <input
                        style={styles.input}
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        placeholder="e.g. NEET Tips Blog"
                    />
                </div>

                <div style={styles.fieldRow}>
                    <label style={styles.label}>Image URL</label>
                    <input
                        style={styles.input}
                        value={imageUrl}
                        onChange={e => setImageUrl(e.target.value)}
                        placeholder="https://..."
                    />
                    <small style={styles.helpText}>
                        Use a direct image URL (CDN, Firebase Storage, Unsplash etc.).
                    </small>
                </div>

                <div style={styles.fieldRow}>
                    <label style={styles.label}>Link (on press)</label>
                    <input
                        style={styles.input}
                        value={link}
                        onChange={e => setLink(e.target.value)}
                        placeholder="https://absedu.in OR /some/internal/route"
                    />
                </div>

                <div style={styles.fieldRowInline}>
                    <div style={{ flex: 1, marginRight: 8 }}>
                        <label style={styles.label}>Order</label>
                        <input
                            style={styles.input}
                            type="number"
                            value={order}
                            onChange={e => setOrder(Number(e.target.value))}
                            min={1}
                        />
                    </div>

                    <label style={{ ...styles.label, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <input
                            type="checkbox"
                            checked={active}
                            onChange={e => setActive(e.target.checked)}
                        />
                        Active
                    </label>
                </div>

                <div style={styles.actionsRow}>
                    {editingId && (
                        <button
                            type="button"
                            onClick={resetForm}
                            style={styles.secondaryBtn}
                        >
                            Cancel edit
                        </button>
                    )}

                    <button
                        type="submit"
                        style={styles.primaryBtn}
                        disabled={saving}
                    >
                        {saving
                            ? 'Saving...'
                            : editingId
                                ? 'Update Banner'
                                : 'Add Banner'}
                    </button>
                </div>
            </form>

            {/* List */}
            <div style={styles.card}>
                <h2 style={styles.cardTitle}>Existing Banners</h2>

                {loading ? (
                    <p style={styles.mutedText}>Loading banners...</p>
                ) : items.length === 0 ? (
                    <p style={styles.mutedText}>No banners yet. Add one above.</p>
                ) : (
                    <table style={styles.table}>
                        <thead>
                            <tr>
                                <th style={styles.th}>Order</th>
                                <th style={styles.th}>Preview</th>
                                <th style={styles.th}>Title</th>
                                <th style={styles.th}>Link</th>
                                <th style={styles.th}>Active</th>
                                <th style={styles.th} />
                            </tr>
                        </thead>
                        <tbody>
                            {items.map(b => (
                                <tr key={b.id}>
                                    <td style={styles.td}>{b.order}</td>
                                    <td style={styles.td}>
                                        {b.imageUrl ? (
                                            <img
                                                src={b.imageUrl}
                                                alt={b.title}
                                                style={{ width: 80, height: 45, objectFit: 'cover', borderRadius: 6 }}
                                            />
                                        ) : (
                                            <span style={styles.mutedText}>No image</span>
                                        )}
                                    </td>
                                    <td style={styles.td}>{b.title}</td>
                                    <td style={styles.td}>
                                        <a href={b.link} target="_blank" rel="noreferrer">
                                            {b.link}
                                        </a>
                                    </td>
                                    <td style={styles.td}>
                                        {b.active ? '✅' : '⛔'}
                                    </td>
                                    <td style={styles.td} align="right">
                                        <button
                                            type="button"
                                            onClick={() => startEdit(b)}
                                            style={styles.smallBtn}
                                        >
                                            Edit
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleDelete(b.id)}
                                            style={{ ...styles.smallBtn, ...styles.smallBtnDanger }}
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}

// Simple inline styles (you can convert to CSS later)
const styles: Record<string, React.CSSProperties> = {
    page: {
        minHeight: '100vh',
        background: '#0f172a',
        padding: '24px',
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        color: '#e5e7eb',
    },
    header: {
        marginBottom: 16,
    },
    title: {
        margin: 0,
        fontSize: 24,
        fontWeight: 700,
        color: '#f9fafb',
    },
    subtitle: {
        margin: '4px 0 0',
        fontSize: 13,
        color: '#9ca3af',
    },
    card: {
        backgroundColor: '#020617',
        borderRadius: 16,
        padding: 16,
        border: '1px solid #1f2937',
        marginBottom: 16,
    },
    cardTitle: {
        margin: 0,
        marginBottom: 12,
        fontSize: 16,
        fontWeight: 600,
    },
    fieldRow: {
        marginBottom: 10,
        display: 'flex',
        flexDirection: 'column',
    },
    fieldRowInline: {
        marginBottom: 10,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
    },
    label: {
        fontSize: 12,
        color: '#9ca3af',
        marginBottom: 4,
    },
    input: {
        borderRadius: 8,
        border: '1px solid #374151',
        padding: '8px 10px',
        fontSize: 13,
        backgroundColor: '#020617',
        color: '#f9fafb',
        outline: 'none',
    },
    helpText: {
        fontSize: 11,
        color: '#6b7280',
        marginTop: 2,
    },
    actionsRow: {
        display: 'flex',
        justifyContent: 'flex-end',
        gap: 8,
        marginTop: 8,
    },
    primaryBtn: {
        borderRadius: 999,
        border: 'none',
        padding: '8px 16px',
        fontSize: 13,
        fontWeight: 600,
        backgroundColor: '#4f46e5',
        color: '#f9fafb',
        cursor: 'pointer',
    },
    secondaryBtn: {
        borderRadius: 999,
        border: '1px solid #4b5563',
        padding: '8px 14px',
        fontSize: 13,
        fontWeight: 500,
        backgroundColor: '#020617',
        color: '#e5e7eb',
        cursor: 'pointer',
    },
    errorBox: {
        marginBottom: 10,
        padding: '8px 10px',
        borderRadius: 10,
        backgroundColor: '#451a1a',
        border: '1px solid #fca5a5',
        color: '#fecaca',
        fontSize: 12,
    },
    mutedText: {
        fontSize: 13,
        color: '#9ca3af',
    },
    table: {
        width: '100%',
        borderCollapse: 'collapse',
        fontSize: 13,
    },
    th: {
        textAlign: 'left',
        padding: '8px 6px',
        borderBottom: '1px solid #1f2937',
        color: '#9ca3af',
        fontWeight: 500,
    },
    td: {
        padding: '8px 6px',
        borderBottom: '1px solid #111827',
        verticalAlign: 'middle',
    },
    smallBtn: {
        borderRadius: 999,
        border: '1px solid #4b5563',
        padding: '4px 10px',
        fontSize: 11,
        fontWeight: 500,
        backgroundColor: '#020617',
        color: '#e5e7eb',
        cursor: 'pointer',
        marginLeft: 4,
    },
    smallBtnDanger: {
        borderColor: '#f87171',
        color: '#fecaca',
    },
};
