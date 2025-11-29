import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';

export default function TopBar() {
    const loc = useLocation();
    const tab = (to: string, label: string) => (
        <Link to={to} style={{ textDecoration: 'none' }}>
            <div style={{ padding: '10px 14px', borderRadius: 10, background: loc.pathname === to ? '#E4D5FF' : '#f3f3f3' }}>{label}</div>
        </Link>
    );
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 12, borderBottom: '1px solid #eee' }}>
            {tab('/banners', 'Banners')}
            {tab('/subjects', 'Subjects')}
            {tab('/units', 'Units')}
            {tab('/pyq_mcq', 'PYQMCQ')}
            {tab('/pyqmcqpapers', 'PYQMcqPapers')}
            {tab('/pyqexampaperspdf', 'PYQExamPapersPDF')}
            {tab('/mocktestpapers', 'MockTestPage')}
            {tab('/chapters', 'Chapters')}
            {tab('/news', 'News')} {/* <-- new */}
            <div style={{ flex: 1 }} />
            <button onClick={() => signOut(auth)}>Sign out</button>
        </div>
    );
}
