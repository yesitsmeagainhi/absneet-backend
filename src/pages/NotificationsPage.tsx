// src/pages/NotificationsPage.tsx
import React, { useEffect, useState } from 'react';
import {
    collection,
    getDocs,
    addDoc,
    deleteDoc,
    updateDoc,
    doc,
    orderBy,
    query,
    serverTimestamp,
    Timestamp,
} from 'firebase/firestore';
import { db } from '../firebase';

type NotificationType = 'info' | 'success' | 'warning' | 'promo';

type Notification = {
    id: string;
    title: string;
    body: string;
    type: NotificationType;
    read: boolean;
    createdAt: Timestamp | null;
    data?: Record<string, any>;
};

const notificationsCol = collection(db, 'notifications');

export default function NotificationsPage() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);

    // Form state
    const [title, setTitle] = useState('');
    const [body, setBody] = useState('');
    const [type, setType] = useState<NotificationType>('info');
    const [sending, setSending] = useState(false);

    // Edit state
    const [editingId, setEditingId] = useState<string | null>(null);

    const loadNotifications = async () => {
        try {
            setLoading(true);
            const q = query(notificationsCol, orderBy('createdAt', 'desc'));
            const snap = await getDocs(q);
            const list = snap.docs.map(d => ({
                id: d.id,
                ...d.data(),
            })) as Notification[];
            setNotifications(list);
        } catch (err) {
            console.error('[NotificationsPage] Load error:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadNotifications();
    }, []);

    const handleSend = async () => {
        if (!title.trim() || !body.trim()) {
            alert('Please enter both title and message body');
            return;
        }

        try {
            setSending(true);

            if (editingId) {
                // Update existing notification
                await updateDoc(doc(db, 'notifications', editingId), {
                    title: title.trim(),
                    body: body.trim(),
                    type,
                });
                alert('Notification updated!');
            } else {
                // Create new notification
                await addDoc(notificationsCol, {
                    title: title.trim(),
                    body: body.trim(),
                    type,
                    read: false,
                    createdAt: serverTimestamp(),
                });
                alert('Notification sent to all users!');
            }

            // Reset form
            setTitle('');
            setBody('');
            setType('info');
            setEditingId(null);

            await loadNotifications();
        } catch (err: any) {
            console.error('[NotificationsPage] Send error:', err);
            alert('Failed to send notification: ' + err.message);
        } finally {
            setSending(false);
        }
    };

    const handleEdit = (notification: Notification) => {
        setEditingId(notification.id);
        setTitle(notification.title);
        setBody(notification.body);
        setType(notification.type);
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setTitle('');
        setBody('');
        setType('info');
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Delete this notification?')) return;

        try {
            await deleteDoc(doc(db, 'notifications', id));
            if (editingId === id) {
                handleCancelEdit();
            }
            await loadNotifications();
        } catch (err: any) {
            console.error('[NotificationsPage] Delete error:', err);
            alert('Failed to delete: ' + err.message);
        }
    };

    const handleMarkAllRead = async () => {
        if (!window.confirm('Mark all notifications as read?')) return;

        try {
            const unread = notifications.filter(n => !n.read);
            for (const n of unread) {
                await updateDoc(doc(db, 'notifications', n.id), { read: true });
            }
            await loadNotifications();
        } catch (err: any) {
            console.error('[NotificationsPage] Mark all read error:', err);
        }
    };

    const formatDate = (timestamp: Timestamp | null) => {
        if (!timestamp) return 'Just now';
        const date = timestamp.toDate();
        return date.toLocaleString();
    };

    const getTypeIcon = (t: NotificationType) => {
        switch (t) {
            case 'success': return '✓';
            case 'warning': return '⚠';
            case 'promo': return '🏷';
            default: return 'ℹ';
        }
    };

    const getTypeColor = (t: NotificationType) => {
        switch (t) {
            case 'success': return { bg: '#dcfce7', border: '#22c55e', text: '#15803d' };
            case 'warning': return { bg: '#fef3c7', border: '#f59e0b', text: '#b45309' };
            case 'promo': return { bg: '#fce7f3', border: '#ec4899', text: '#be185d' };
            default: return { bg: '#dbeafe', border: '#3b82f6', text: '#1d4ed8' };
        }
    };

    const unreadCount = notifications.filter(n => !n.read).length;

    return (
        <div style={{ padding: 20, maxWidth: 1200, margin: '0 auto' }}>
            <h2 style={{ marginBottom: 20 }}>Push Notifications</h2>

            {/* Send Notification Form */}
            <div style={{
                background: editingId ? '#eff6ff' : '#f0fdf4',
                border: editingId ? '2px solid #3b82f6' : '1px solid #bbf7d0',
                borderRadius: 12,
                padding: 20,
                marginBottom: 24,
            }}>
                <h3 style={{ marginBottom: 16, color: editingId ? '#1d4ed8' : '#15803d' }}>
                    {editingId ? 'Edit Notification' : 'Send New Notification'}
                </h3>

                <div style={{ display: 'grid', gap: 12 }}>
                    {/* Title */}
                    <div>
                        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4, color: '#374151' }}>
                            Title *
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            placeholder="Notification title..."
                            style={{
                                width: '100%',
                                padding: '10px 12px',
                                borderRadius: 8,
                                border: '1px solid #d1d5db',
                                fontSize: 14,
                            }}
                        />
                    </div>

                    {/* Body */}
                    <div>
                        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4, color: '#374151' }}>
                            Message Body *
                        </label>
                        <textarea
                            value={body}
                            onChange={e => setBody(e.target.value)}
                            placeholder="Enter your notification message..."
                            rows={3}
                            style={{
                                width: '100%',
                                padding: '10px 12px',
                                borderRadius: 8,
                                border: '1px solid #d1d5db',
                                fontSize: 14,
                                resize: 'vertical',
                            }}
                        />
                    </div>

                    {/* Type */}
                    <div>
                        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4, color: '#374151' }}>
                            Notification Type
                        </label>
                        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                            {(['info', 'success', 'warning', 'promo'] as NotificationType[]).map(t => {
                                const colors = getTypeColor(t);
                                return (
                                    <label
                                        key={t}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 6,
                                            padding: '8px 14px',
                                            borderRadius: 8,
                                            border: type === t ? `2px solid ${colors.border}` : '1px solid #d1d5db',
                                            background: type === t ? colors.bg : '#fff',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s',
                                        }}
                                    >
                                        <input
                                            type="radio"
                                            name="notificationType"
                                            value={t}
                                            checked={type === t}
                                            onChange={() => setType(t)}
                                            style={{ accentColor: colors.border }}
                                        />
                                        <span style={{ fontSize: 16 }}>{getTypeIcon(t)}</span>
                                        <span style={{
                                            fontSize: 13,
                                            fontWeight: 600,
                                            color: type === t ? colors.text : '#6b7280',
                                            textTransform: 'capitalize',
                                        }}>
                                            {t}
                                        </span>
                                    </label>
                                );
                            })}
                        </div>
                    </div>

                    {/* Buttons */}
                    <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                        <button
                            onClick={handleSend}
                            disabled={sending || !title.trim() || !body.trim()}
                            style={{
                                background: editingId ? '#2563eb' : '#16a34a',
                                color: '#fff',
                                border: 'none',
                                padding: '12px 24px',
                                borderRadius: 8,
                                fontSize: 14,
                                fontWeight: 600,
                                cursor: sending ? 'wait' : 'pointer',
                                opacity: (sending || !title.trim() || !body.trim()) ? 0.6 : 1,
                            }}
                        >
                            {sending ? 'Sending...' : editingId ? 'Update Notification' : 'Send Notification'}
                        </button>
                        {editingId && (
                            <button
                                onClick={handleCancelEdit}
                                style={{
                                    background: '#f3f4f6',
                                    color: '#374151',
                                    border: '1px solid #d1d5db',
                                    padding: '12px 24px',
                                    borderRadius: 8,
                                    fontSize: 14,
                                    cursor: 'pointer',
                                }}
                            >
                                Cancel Edit
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Notifications List */}
            <div style={{
                background: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: 12,
                overflow: 'hidden',
            }}>
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '16px 20px',
                    borderBottom: '1px solid #e5e7eb',
                    background: '#f9fafb',
                }}>
                    <h3 style={{ margin: 0 }}>
                        Sent Notifications
                        {unreadCount > 0 && (
                            <span style={{
                                marginLeft: 10,
                                padding: '2px 8px',
                                background: '#fef2f2',
                                color: '#dc2626',
                                borderRadius: 12,
                                fontSize: 12,
                                fontWeight: 600,
                            }}>
                                {unreadCount} unread
                            </span>
                        )}
                    </h3>
                    {unreadCount > 0 && (
                        <button
                            onClick={handleMarkAllRead}
                            style={{
                                background: '#dbeafe',
                                color: '#1d4ed8',
                                border: '1px solid #93c5fd',
                                padding: '6px 12px',
                                borderRadius: 6,
                                fontSize: 12,
                                cursor: 'pointer',
                            }}
                        >
                            Mark all as read
                        </button>
                    )}
                </div>

                {loading ? (
                    <div style={{ padding: 40, textAlign: 'center', color: '#6b7280' }}>
                        Loading notifications...
                    </div>
                ) : notifications.length === 0 ? (
                    <div style={{ padding: 40, textAlign: 'center', color: '#6b7280' }}>
                        No notifications sent yet. Create your first notification above!
                    </div>
                ) : (
                    <div style={{ maxHeight: 500, overflow: 'auto' }}>
                        {notifications.map(n => {
                            const colors = getTypeColor(n.type);
                            return (
                                <div
                                    key={n.id}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'flex-start',
                                        gap: 14,
                                        padding: '16px 20px',
                                        borderBottom: '1px solid #f3f4f6',
                                        background: editingId === n.id ? '#eff6ff' : (!n.read ? '#fefce8' : '#fff'),
                                    }}
                                >
                                    {/* Type Icon */}
                                    <div style={{
                                        width: 40,
                                        height: 40,
                                        borderRadius: 20,
                                        background: colors.bg,
                                        border: `1px solid ${colors.border}`,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: 18,
                                        flexShrink: 0,
                                    }}>
                                        {getTypeIcon(n.type)}
                                    </div>

                                    {/* Content */}
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                            <span style={{ fontSize: 15, fontWeight: 600, color: '#111827' }}>
                                                {n.title}
                                            </span>
                                            {!n.read && (
                                                <span style={{
                                                    width: 8,
                                                    height: 8,
                                                    borderRadius: 4,
                                                    background: '#ef4444',
                                                }} />
                                            )}
                                            <span style={{
                                                padding: '2px 6px',
                                                background: colors.bg,
                                                color: colors.text,
                                                borderRadius: 4,
                                                fontSize: 10,
                                                fontWeight: 600,
                                                textTransform: 'uppercase',
                                            }}>
                                                {n.type}
                                            </span>
                                        </div>
                                        <p style={{
                                            margin: 0,
                                            fontSize: 13,
                                            color: '#4b5563',
                                            lineHeight: 1.5,
                                        }}>
                                            {n.body}
                                        </p>
                                        <span style={{ fontSize: 11, color: '#9ca3af', marginTop: 6, display: 'block' }}>
                                            {formatDate(n.createdAt)}
                                        </span>
                                    </div>

                                    {/* Actions */}
                                    <div style={{ display: 'flex', gap: 6 }}>
                                        <button
                                            onClick={() => handleEdit(n)}
                                            disabled={editingId === n.id}
                                            style={{
                                                background: '#eff6ff',
                                                color: '#2563eb',
                                                border: '1px solid #bfdbfe',
                                                padding: '6px 12px',
                                                borderRadius: 6,
                                                fontSize: 12,
                                                cursor: editingId === n.id ? 'default' : 'pointer',
                                                opacity: editingId === n.id ? 0.5 : 1,
                                            }}
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleDelete(n.id)}
                                            style={{
                                                background: '#fef2f2',
                                                color: '#dc2626',
                                                border: '1px solid #fecaca',
                                                padding: '6px 12px',
                                                borderRadius: 6,
                                                fontSize: 12,
                                                cursor: 'pointer',
                                            }}
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
