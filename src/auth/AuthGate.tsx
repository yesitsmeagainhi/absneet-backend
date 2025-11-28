import React, { useEffect, useState } from 'react';
import { auth, googleProvider } from '../firebase';
import { onAuthStateChanged, signInWithEmailAndPassword, signInWithPopup, signOut } from 'firebase/auth';


const ALLOWLIST = [
    "bwtnaresh@gmail.com"];


export default function AuthGate({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<any>(null);
    const [email, setEmail] = useState('');
    const [pass, setPass] = useState('');
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState('');


    useEffect(() => {
        return onAuthStateChanged(auth, (u) => { setUser(u); setLoading(false); });
    }, []);


    if (loading) return <div style={{ padding: 24 }}>Loading…</div>;


    if (!user) {
        return (
            <div style={{ maxWidth: 420, margin: '64px auto', padding: 24, border: '1px solid #ddd', borderRadius: 12 }}>
                <h2>Admin Login</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <input placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
                    <input placeholder="Password" type="password" value={pass} onChange={e => setPass(e.target.value)} />
                    <button onClick={async () => { try { await signInWithEmailAndPassword(auth, email, pass); } catch (e: any) { setErr(e.message); } }}>Sign in</button>
                    <button onClick={async () => { try { await signInWithPopup(auth, googleProvider); } catch (e: any) { setErr(e.message); } }}>Sign in with Google</button>
                    {err && <div style={{ color: 'crimson' }}>{err}</div>}
                </div>
            </div>
        );
    }


    if (ALLOWLIST.length && !ALLOWLIST.includes(user.email)) {
        return (
            <div style={{ maxWidth: 480, margin: '64px auto', padding: 24, border: '1px solid #ddd', borderRadius: 12 }}>
                <h3>Access denied for {user.email}</h3>
                <button onClick={() => signOut(auth)}>Sign out</button>
            </div>
        );
    }


    return <>{children}</>;
}