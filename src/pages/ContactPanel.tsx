// src/pages/ContactSettingsPanel.tsx
import React, {
    useEffect,
    useState,

} from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

type ContactConfig = {
    supportPhone: string;
    whatsappPhone: string;
    supportEmail: string;
    officeAddress: string;
    officeHours: string;
    mapsQueryOverride: string;
};

const defaultValues: ContactConfig = {
    supportPhone: '',
    whatsappPhone: '',
    supportEmail: '',
    officeAddress: '',
    officeHours: '',
    mapsQueryOverride: '',
};

const ContactSettingsPanel: React.FC = () => {
    const [form, setForm] = useState<ContactConfig>(defaultValues);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');

    // 🔹 Load existing contactInfo
    useEffect(() => {
        const load = async () => {
            try {
                const ref = doc(db, 'nodes', 'contactInfo');
                const snap = await getDoc(ref);

                console.log('[ContactPanel] snapshot exists:', snap.exists());

                if (snap.exists()) {
                    const data = snap.data() as Partial<ContactConfig>;
                    setForm({ ...defaultValues, ...data });
                } else {
                    setMessage('No contact settings found yet. Fill and save.');
                }
            } catch (err) {
                console.error('Failed to load contactInfo:', err);
                setMessage('Failed to load contact settings.');
            } finally {
                setLoading(false);
            }
        };

        load();
    }, []);


    const handleChange =
        (field: keyof ContactConfig) =>
            (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
                setForm(prev => ({ ...prev, [field]: e.target.value }));
            };
    const handleSave = async () => {
        try {
            setSaving(true);
            setMessage('');

            const ref = doc(db, 'nodes', 'contactInfo');
            await setDoc(
                ref,
                {
                    type: 'contact',
                    ...form,
                },
                { merge: true },
            );

            setMessage('✅ Contact settings saved successfully.');
        } catch (err) {
            console.error('Failed to save contactInfo:', err);
            setMessage('❌ Failed to save contact settings.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div style={{ padding: 16 }}>Loading contact settings...</div>;
    }

    return (
        <div style={{ maxWidth: 600, margin: '0 auto', padding: 16 }}>
            <h2>Help &amp; Support – Contact Settings</h2>
            <p style={{ marginBottom: 16, color: '#555' }}>
                These details are used in the app on the Help &amp; Support screen. Update and click
                <strong> Save</strong>.
            </p>

            {message && (
                <div
                    style={{
                        marginBottom: 12,
                        color: message.startsWith('✅') ? 'green' : 'red',
                    }}
                >
                    {message}
                </div>
            )}

            <label>
                Support Phone (Call)
                <input
                    type="text"
                    value={form.supportPhone}
                    onChange={handleChange('supportPhone')}
                    placeholder="+9198XXXXXXXX"
                    style={{
                        display: 'block',
                        width: '100%',
                        marginTop: 4,
                        marginBottom: 10,
                        padding: 8,
                    }}
                />
            </label>

            <label>
                WhatsApp Phone
                <input
                    type="text"
                    value={form.whatsappPhone}
                    onChange={handleChange('whatsappPhone')}
                    placeholder="+9198XXXXXXXX"
                    style={{
                        display: 'block',
                        width: '100%',
                        marginTop: 4,
                        marginBottom: 10,
                        padding: 8,
                    }}
                />
            </label>

            <label>
                Support Email
                <input
                    type="email"
                    value={form.supportEmail}
                    onChange={handleChange('supportEmail')}
                    placeholder="support@example.com"
                    style={{
                        display: 'block',
                        width: '100%',
                        marginTop: 4,
                        marginBottom: 10,
                        padding: 8,
                    }}
                />
            </label>

            <label>
                Office Address
                <textarea
                    value={form.officeAddress}
                    onChange={handleChange('officeAddress')}
                    rows={4}
                    placeholder="Full office address"
                    style={{
                        display: 'block',
                        width: '100%',
                        marginTop: 4,
                        marginBottom: 10,
                        padding: 8,
                    }}
                />
            </label>

            <label>
                Office Hours
                <input
                    type="text"
                    value={form.officeHours}
                    onChange={handleChange('officeHours')}
                    placeholder="10:00 AM – 7:00 PM (Mon–Sat)"
                    style={{
                        display: 'block',
                        width: '100%',
                        marginTop: 4,
                        marginBottom: 10,
                        padding: 8,
                    }}
                />
            </label>

            <label>
                Maps Query Override (optional)
                <input
                    type="text"
                    value={form.mapsQueryOverride}
                    onChange={handleChange('mapsQueryOverride')}
                    placeholder="If empty, address will be used"
                    style={{
                        display: 'block',
                        width: '100%',
                        marginTop: 4,
                        marginBottom: 10,
                        padding: 8,
                    }}
                />
            </label>

            <button
                onClick={handleSave}
                disabled={saving}
                style={{
                    padding: '8px 16px',
                    borderRadius: 4,
                    border: 'none',
                    background: '#4F46E5',
                    color: 'white',
                    cursor: 'pointer',
                }}
            >
                {saving ? 'Saving…' : 'Save'}
            </button>
        </div>
    );
};

export default ContactSettingsPanel;
