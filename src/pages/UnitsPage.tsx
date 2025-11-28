// import React, { useEffect, useMemo, useState } from 'react';
// import { db } from '../firebase';
// import { addDoc, collection, deleteDoc, doc, getDocs, orderBy, query, serverTimestamp, updateDoc, where } from 'firebase/firestore';
// import type { SubjectDoc, UnitDoc } from '../types';


// export default function UnitsPage() {
//     const [subjects, setSubjects] = useState<SubjectDoc[]>([]);
//     const [units, setUnits] = useState<UnitDoc[]>([]);
//     const [subjectId, setSubjectId] = useState('');
//     const [name, setName] = useState('');
//     const [order, setOrder] = useState(1);


//     const loadSubjects = async () => {
//         const q = query(collection(db, 'neet'), where('type', '==', 'subject'), orderBy('order', 'asc'));
//         const snap = await getDocs(q);
//         const list = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })) as SubjectDoc[];
//         setSubjects(list);
//         if (!subjectId && list[0]?.id) setSubjectId(list[0].id);
//     };


//     const loadUnits = async () => {
//         if (!subjectId) { setUnits([]); return; }
//         const q = query(collection(db, 'neet'), where('type', '==', 'unit'), where('subjectId', '==', subjectId), orderBy('order', 'asc'));
//         const snap = await getDocs(q);
//         setUnits(snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })) as UnitDoc[]);
//     };


//     useEffect(() => { loadSubjects(); }, []);
//     useEffect(() => { loadUnits(); }, [subjectId]);


//     const add = async () => {
//         if (!subjectId || !name) return;
//         await addDoc(collection(db, 'neet'), { type: 'unit', subjectId, name, order: Number(order) || 0, createdAt: serverTimestamp() });
//         setName(''); setOrder(units.length + 2); await loadUnits();
//     };


//     const save = async (id: string, patch: Partial<UnitDoc>) => { await updateDoc(doc(db, 'neet', id), patch as any); await loadUnits(); };
//     const remove = async (id: string) => { await deleteDoc(doc(db, 'neet', id)); await loadUnits(); };

//     return (
//         <div style={{ padding: 16 }}>
//             <h2>Units</h2>
//             <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
//                 <label>Subject</label>
//                 <select value={subjectId} onChange={(e) => setSubjectId(e.target.value)}>
//                     {subjects.map(s => <option value={s.id} key={s.id}>{s.name}</option>)}
//                 </select>
//             </div>


//             <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
//                 <input placeholder="Unit name" value={name} onChange={e => setName(e.target.value)} />
//                 <input placeholder="Order" type="number" value={order} onChange={e => setOrder(Number(e.target.value))} style={{ width: 100 }} />
//                 <button onClick={add}>Add</button>
//             </div>


//             <table width="100%" cellPadding={8} style={{ borderCollapse: 'collapse' }}>
//                 <thead><tr><th align="left">Unit</th><th>Order</th><th>Actions</th></tr></thead>
//                 <tbody>
//                     {units.map(u => (
//                         <tr key={u.id} style={{ borderTop: '1px solid #eee' }}>
//                             <td>{u.name}</td>
//                             <td><input type="number" defaultValue={u.order} style={{ width: 80 }} onBlur={(e) => save(u.id!, { order: Number(e.currentTarget.value) })} /></td>
//                             <td><button onClick={() => remove(u.id!)} style={{ color: 'crimson' }}>Delete</button></td>
//                         </tr>
//                     ))}
//                 </tbody>
//             </table>
//         </div>
//     );
// }

// src/pages/UnitsPage.tsx
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
import type { SubjectDoc, UnitDoc } from '../types';

const col = collection(db, 'nodes');

export default function UnitsPage() {
  const [subjects, setSubjects] = useState<SubjectDoc[]>([]);
  const [units, setUnits] = useState<UnitDoc[]>([]);
  const [subjectId, setSubjectId] = useState('');
  const [name, setName] = useState('');
  const [order, setOrder] = useState(1);

  // 🔹 Load subjects from nodes where type = 'subject'
  const loadSubjects = async () => {
    const q = query(
      col,
      where('type', '==', 'subject'),
      orderBy('order', 'asc'),
    );
    const snap = await getDocs(q);
    const list = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })) as SubjectDoc[];
    setSubjects(list);

    // auto-select first subject if none selected
    if (!subjectId && list[0]?.id) {
      setSubjectId(list[0].id);
    }
  };

  // 🔹 Load units for selected subject (parentId = subjectId, type = 'unit')
  const loadUnits = async (forSubjectId?: string) => {
    const sid = forSubjectId ?? subjectId;
    if (!sid) {
      setUnits([]);
      setOrder(1);
      return;
    }

    const q = query(
      col,
      where('type', '==', 'unit'),
      where('parentId', '==', sid), // ✅ unit belongs to subject
      orderBy('order', 'asc'),
    );
    const snap = await getDocs(q);
    const list = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })) as UnitDoc[];
    setUnits(list);

    // set next order based on current units count
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
      setOrder(1);
    }
  }, [subjectId]);

  // 🔹 Add new unit under nodes with parentId + subjectId
  const add = async () => {
    if (!subjectId || !name.trim()) return;

    await addDoc(col, {
      type: 'unit',
      parentId: subjectId,         // ✅ direct parent link
      subjectId,                   // ✅ full path field
      name: name.trim(),
      order: Number(order) || 0,
      createdAt: serverTimestamp(),
    } as Omit<UnitDoc, 'id'>);

    setName('');
    // After adding, reload units to refresh and recompute order
    await loadUnits(subjectId);
  };

  // 🔹 Update order (or other fields if needed)
  const save = async (id: string, patch: Partial<UnitDoc>) => {
    await updateDoc(doc(db, 'nodes', id), patch as any);
    await loadUnits();
  };

  // 🔹 Delete unit
  const remove = async (id: string) => {
    if (!window.confirm('Delete this unit?')) return;
    await deleteDoc(doc(db, 'nodes', id));
    await loadUnits();
  };

  return (
    <div style={{ padding: 16 }}>
      <h2>Units</h2>

      {/* Subject selector */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
        <label>Subject</label>
        <select
          value={subjectId}
          onChange={e => setSubjectId(e.target.value)}
        >
          {subjects.map(s => (
            <option value={s.id} key={s.id}>
              {s.name}
            </option>
          ))}
          {subjects.length === 0 && <option>No subjects</option>}
        </select>
      </div>

      {/* Add unit form */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <input
          placeholder="Unit name"
          value={name}
          onChange={e => setName(e.target.value)}
        />
        <input
          placeholder="Order"
          type="number"
          value={order}
          onChange={e => setOrder(Number(e.target.value))}
          style={{ width: 100 }}
        />
        <button onClick={add} disabled={!subjectId || !name.trim()}>
          Add
        </button>
      </div>

      {/* Units list */}
      <table width="100%" cellPadding={8} style={{ borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th align="left">Unit</th>
            <th>Order</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {units.map(u => (
            <tr key={u.id} style={{ borderTop: '1px solid #eee' }}>
              <td>{u.name}</td>
              <td>
                <input
                  type="number"
                  defaultValue={u.order ?? 0}
                  style={{ width: 80 }}
                  onBlur={e =>
                    save(u.id!, { order: Number(e.currentTarget.value) })
                  }
                />
              </td>
              <td>
                <button
                  onClick={() => remove(u.id!)}
                  style={{ color: 'crimson' }}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
          {!units.length && (
            <tr>
              <td colSpan={3} style={{ paddingTop: 12, color: '#777' }}>
                No units yet for this subject.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
