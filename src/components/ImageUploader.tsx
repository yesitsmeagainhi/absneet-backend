// src/components/ImageUploader.tsx
import React, { useState, useRef } from 'react';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase';

interface ImageUploaderProps {
    value: string;                    // Current image URL
    onChange: (url: string) => void;  // Callback when URL changes
    folder?: string;                  // Firebase Storage folder (default: 'questions')
    label?: string;                   // Optional label
    placeholder?: string;             // URL input placeholder
}

export default function ImageUploader({
    value,
    onChange,
    folder = 'questions',
    label,
    placeholder = 'https://...',
}: ImageUploaderProps) {
    const [mode, setMode] = useState<'url' | 'upload'>('url');
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            setError('Please select an image file');
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            setError('Image must be less than 5MB');
            return;
        }

        try {
            setUploading(true);
            setError(null);
            setProgress(0);

            // Create unique filename
            const timestamp = Date.now();
            const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
            const storageRef = ref(storage, `${folder}/${timestamp}_${safeName}`);

            // Upload with progress tracking
            const uploadTask = uploadBytesResumable(storageRef, file);

            uploadTask.on(
                'state_changed',
                (snapshot) => {
                    const pct = Math.round(
                        (snapshot.bytesTransferred / snapshot.totalBytes) * 100
                    );
                    setProgress(pct);
                },
                (err) => {
                    console.error('[ImageUploader] upload error', err);
                    setError(err.message || 'Upload failed');
                    setUploading(false);
                },
                async () => {
                    // Upload completed, get download URL
                    const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
                    onChange(downloadUrl);
                    setUploading(false);
                    setProgress(0);
                }
            );
        } catch (err: any) {
            console.error('[ImageUploader] error', err);
            setError(err.message || 'Upload failed');
            setUploading(false);
        }

        // Reset file input
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleClear = () => {
        onChange('');
        setError(null);
    };

    return (
        <div style={styles.container}>
            {label && <label style={styles.label}>{label}</label>}

            {/* Mode toggle */}
            <div style={styles.modeToggle}>
                <button
                    type="button"
                    onClick={() => setMode('url')}
                    style={{
                        ...styles.modeBtn,
                        ...(mode === 'url' ? styles.modeBtnActive : {}),
                    }}
                >
                    URL
                </button>
                <button
                    type="button"
                    onClick={() => setMode('upload')}
                    style={{
                        ...styles.modeBtn,
                        ...(mode === 'upload' ? styles.modeBtnActive : {}),
                    }}
                >
                    Upload
                </button>
            </div>

            {/* Input area */}
            <div style={styles.inputRow}>
                {mode === 'url' ? (
                    <input
                        type="text"
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        placeholder={placeholder}
                        style={styles.input}
                    />
                ) : (
                    <div style={styles.uploadArea}>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            disabled={uploading}
                            style={styles.fileInput}
                        />
                        {uploading && (
                            <div style={styles.progressBar}>
                                <div
                                    style={{
                                        ...styles.progressFill,
                                        width: `${progress}%`,
                                    }}
                                />
                                <span style={styles.progressText}>{progress}%</span>
                            </div>
                        )}
                    </div>
                )}

                {/* Preview & Clear */}
                {value && (
                    <div style={styles.previewArea}>
                        <a href={value} target="_blank" rel="noreferrer">
                            <img
                                src={value}
                                alt="Preview"
                                style={styles.preview}
                                onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none';
                                }}
                            />
                        </a>
                        <button
                            type="button"
                            onClick={handleClear}
                            style={styles.clearBtn}
                            title="Remove image"
                        >
                            X
                        </button>
                    </div>
                )}
            </div>

            {error && <div style={styles.error}>{error}</div>}
        </div>
    );
}

const styles: Record<string, React.CSSProperties> = {
    container: {
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
    },
    label: {
        fontSize: 11,
        color: '#9ca3af',
        marginBottom: 2,
    },
    modeToggle: {
        display: 'flex',
        gap: 4,
        marginBottom: 4,
    },
    modeBtn: {
        padding: '2px 8px',
        fontSize: 10,
        borderRadius: 4,
        border: '1px solid #374151',
        background: '#020617',
        color: '#9ca3af',
        cursor: 'pointer',
    },
    modeBtnActive: {
        background: '#1e3a5f',
        borderColor: '#38bdf8',
        color: '#7dd3fc',
    },
    inputRow: {
        display: 'flex',
        alignItems: 'center',
        gap: 8,
    },
    input: {
        flex: 1,
        padding: '6px 8px',
        borderRadius: 6,
        border: '1px solid #1f2937',
        background: '#020617',
        color: '#e5e7eb',
        fontSize: 12,
        minWidth: 0,
    },
    uploadArea: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
    },
    fileInput: {
        fontSize: 11,
        color: '#9ca3af',
    },
    progressBar: {
        position: 'relative',
        height: 16,
        background: '#1f2937',
        borderRadius: 4,
        overflow: 'hidden',
    },
    progressFill: {
        position: 'absolute',
        top: 0,
        left: 0,
        height: '100%',
        background: '#22c55e',
        transition: 'width 0.2s ease',
    },
    progressText: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 10,
        color: '#fff',
        fontWeight: 600,
    },
    previewArea: {
        display: 'flex',
        alignItems: 'center',
        gap: 4,
    },
    preview: {
        width: 40,
        height: 40,
        objectFit: 'cover',
        borderRadius: 4,
        border: '1px solid #374151',
    },
    clearBtn: {
        width: 20,
        height: 20,
        borderRadius: 4,
        border: '1px solid #f87171',
        background: 'transparent',
        color: '#fca5a5',
        cursor: 'pointer',
        fontSize: 10,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 0,
    },
    error: {
        fontSize: 11,
        color: '#f87171',
        marginTop: 2,
    },
};
