// import React, { useEffect, useState } from 'react';
// import { db } from '../firebase';
// import { addDoc, collection, deleteDoc, doc, getDocs, orderBy, query, serverTimestamp, updateDoc, where } from 'firebase/firestore';
// import type { SubjectDoc } from '../types';


// export default function SubjectsPage() {
//     const [items, setItems] = useState<SubjectDoc[]>([]);
//     const [name, setName] = useState('');
//     const [order, setOrder] = useState<number>(items.length + 1);


//     const load = async () => {
//         const q = query(collection(db, 'neet'), where('type', '==', 'subject'), orderBy('order', 'asc'));
//         const snap = await getDocs(q);
//         setItems(snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })) as SubjectDoc[]);
//     };
//     useEffect(() => { load(); }, []);


//     const add = async () => {
//         if (!name) return;
//         await addDoc(collection(db, 'neet'), { type: 'subject', name, order: Number(order) || 0, createdAt: serverTimestamp() });
//         setName(''); setOrder(items.length + 2); await load();
//     };


//     const save = async (id: string, patch: Partial<SubjectDoc>) => {
//         await updateDoc(doc(db, 'neet', id), patch as any); await load();
//     };


//     const remove = async (id: string) => { await deleteDoc(doc(db, 'neet', id)); await load(); };


//     return (
//         <div style={{ padding: 16 }}>
//             <h2>Subjects</h2>


//             <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
//                 <input placeholder="Name" value={name} onChange={e => setName(e.target.value)} />
//                 <input placeholder="Order" value={order} onChange={e => setOrder(Number(e.target.value))} type="number" style={{ width: 100 }} />
//                 <button onClick={add}>Add</button>
//             </div>


//             <table width="100%" cellPadding={8} style={{ borderCollapse: 'collapse' }}>
//                 <thead><tr><th align="left">Name</th><th>Order</th><th>Actions</th></tr></thead>
//                 <tbody>
//                     {items.map(it => (
//                         <tr key={it.id} style={{ borderTop: '1px solid #eee' }}>
//                             <td>{it.name}</td>
//                             <td>
//                                 <input type="number" defaultValue={it.order} style={{ width: 80 }}
//                                     onBlur={(e) => save(it.id!, { order: Number(e.currentTarget.value) })} />
//                             </td>
//                             <td>
//                                 <button onClick={() => remove(it.id!)} style={{ color: 'crimson' }}>Delete</button>
//                             </td>
//                         </tr>
//                     ))}
//                 </tbody>
//             </table>
//         </div>
//     );
// }


// src/admin/SubjectsPage.tsx
import React, { useCallback, useEffect, useMemo, useState } from 'react';
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

export type SubjectDoc = {
    id?: string;
    type: 'subject';
    name: string;
    order?: number;
    active?: boolean;
    slug?: string;
    createdAt?: any;
};

const col = collection(db, 'nodes');

function slugify(s: string) {
    return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 80);
}

export default function SubjectsPage() {
    const [items, setItems] = useState<SubjectDoc[]>([]);
    const [name, setName] = useState('');
    const [order, setOrder] = useState<number>(1);
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState<string | null>(null);
    const [indexMissingUrl, setIndexMissingUrl] = useState<string | null>(null);

    const qSubjects = useMemo(
        () => query(col, where('type', '==', 'subject'), orderBy('order', 'asc')),
        []
    );

    const recomputeNextOrder = useCallback((rows: SubjectDoc[]) => {
        const maxOrder = rows.reduce((m, r) => Math.max(m, Number(r.order ?? 0)), 0);
        setOrder(maxOrder + 1);
    }, []);

    // Preflight: check composite index availability (shows console "Create index" link if missing)
    const checkIndex = useCallback(async () => {
        try {
            await getDocs(query(col, where('type', '==', 'subject'), orderBy('order', 'asc')));
            setIndexMissingUrl(null);
        } catch (e: any) {
            if (e?.code === 'failed-precondition') {
                const m = String(e.message || '').match(/https?:\/\/[^\s)]+/);
                setIndexMissingUrl(m?.[0] || null);
            } else {
                setIndexMissingUrl(null); // don’t show banner for other errors
            }
        }
    }, []);

    const load = useCallback(async () => {
        setLoading(true);
        setErr(null);
        try {
            const snap = await getDocs(qSubjects);
            const rows = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as SubjectDoc[];
            setItems(rows);
            recomputeNextOrder(rows);
        } catch (e: any) {
            console.error('[Subjects admin] load error', e);
            setErr(e?.message || 'Failed to load subjects');
        } finally {
            setLoading(false);
        }
    }, [qSubjects, recomputeNextOrder]);

    useEffect(() => {
        checkIndex();
        load();
    }, [checkIndex, load]);

    const add = async () => {
        const nm = name.trim();
        if (!nm) return;
        try {
            await addDoc(col, {
                type: 'subject',
                name: nm,
                order: Number(order) || 0,
                slug: slugify(nm),
                active: true,
                createdAt: serverTimestamp(),
            } as Omit<SubjectDoc, 'id'>);
            setName('');
            await load();
        } catch (e) {
            console.error('[Subjects admin] add error', e);
            alert('Failed to add subject');
        }
    };

    const save = async (id: string, patch: Partial<SubjectDoc>) => {
        try {
            await updateDoc(doc(db, 'nodes', id), patch as any);
            await load();
        } catch (e) {
            console.error('[Subjects admin] save error', e);
            alert('Failed to save changes');
        }
    };

    const remove = async (id: string) => {
        if (!confirm('Delete this subject?')) return;
        try {
            await deleteDoc(doc(db, 'nodes', id));
            await load();
        } catch (e) {
            console.error('[Subjects admin] delete error', e);
            alert('Failed to delete');
        }
    };

    return (
        <div style={{ padding: 16 }}>
            <h2>Subjects</h2>

            {indexMissingUrl && (
                <div style={{
                    background: '#ffecec',
                    color: '#7a2e2e',
                    border: '1px solid #f5c2c7',
                    padding: 12,
                    borderRadius: 8,
                    margin: '12px 0'
                }}>
                    Composite index required for <code>(type, order)</code>.{' '}
                    <a href={indexMissingUrl} target="_blank" rel="noreferrer">Create it now</a>.{' '}
                    <button onClick={checkIndex} style={{ marginLeft: 8 }}>Recheck</button>
                </div>
            )}

            {err && <div style={{ margin: '8px 0', color: 'crimson' }}>Error: {err}</div>}

            {/* Create */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                <input
                    placeholder="Subject name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                />
                <input
                    placeholder="Order"
                    value={order}
                    onChange={(e) => setOrder(Number(e.target.value))}
                    type="number"
                    style={{ width: 100 }}
                />
                <button onClick={add} disabled={!name.trim()}>Add</button>
                <button onClick={load} disabled={loading}>Reload</button>
            </div>

            {/* List */}
            <table width="100%" cellPadding={8} style={{ borderCollapse: 'collapse' }}>
                <thead>
                    <tr>
                        <th align="left">Name</th>
                        <th>Order</th>
                        <th>Active</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {items.map((it) => (
                        <tr key={it.id} style={{ borderTop: '1px solid #eee' }}>
                            <td>
                                <input
                                    defaultValue={it.name}
                                    onBlur={(e) => {
                                        const v = e.currentTarget.value.trim();
                                        if (v && v !== it.name) {
                                            save(it.id!, { name: v, slug: slugify(v) });
                                        }
                                    }}
                                />
                            </td>
                            <td>
                                <input
                                    type="number"
                                    defaultValue={it.order ?? 0}
                                    style={{ width: 80 }}
                                    onBlur={(e) => save(it.id!, { order: Number(e.currentTarget.value) })}
                                />
                            </td>
                            <td style={{ textAlign: 'center' }}>
                                <input
                                    type="checkbox"
                                    defaultChecked={!!it.active}
                                    onChange={(e) => save(it.id!, { active: e.target.checked })}
                                />
                            </td>
                            <td>
                                <button onClick={() => remove(it.id!)} style={{ color: 'crimson' }}>
                                    Delete
                                </button>
                            </td>
                        </tr>
                    ))}
                    {items.length === 0 && !loading && (
                        <tr>
                            <td colSpan={4} style={{ textAlign: 'center', padding: 16 }}>
                                No subjects yet.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}
