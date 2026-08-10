// src/shared/components/AttachmentList.tsx
// Shared file attachment chip list — used in lab results, consultations, procedures, referrals
import { useTranslation } from 'react-i18next';

export interface Attachment {
    id: number;
    original_filename: string;
    file_size: number | null;
    mime_type: string;
    download_url: string | null;
    created_at?: string;
    uploaded_by_name?: string;
}

function fileIcon(mimeType: string): string {
    if (mimeType.startsWith('image/')) return '🖼';
    if (mimeType === 'application/pdf') return '📄';
    if (mimeType.includes('word') || mimeType.includes('document')) return '📝';
    if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return '📊';
    return '📎';
}

function formatBytes(bytes: number | null): string {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface Props {
    attachments: Attachment[];
    style?: React.CSSProperties;
    // When true, show who uploaded each file (e.g. to tell the referring
    // doctor's documents from the specialist's response documents).
    showUploader?: boolean;
}

export function AttachmentList({ attachments, style, showUploader }: Props) {
    const { t } = useTranslation();
    if (!attachments.length) return null;

    return (
        <div className="attachment-list" style={style}>
            {attachments.map(att => (
                att.download_url ? (
                    <a
                        key={att.id}
                        href={att.download_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="attachment-chip attachment-chip--link"
                        title={att.original_filename}
                    >
                        <span className="attachment-icon">{fileIcon(att.mime_type)}</span>
                        <span className="attachment-name">{att.original_filename}</span>
                        {showUploader && att.uploaded_by_name && (
                            <span className="attachment-uploader">· {att.uploaded_by_name}</span>
                        )}
                        {att.file_size && (
                            <span className="attachment-size">{formatBytes(att.file_size)}</span>
                        )}
                    </a>
                ) : (
                    <span
                        key={att.id}
                        className="attachment-chip attachment-chip--unavailable"
                        title={t('attachments.file_not_available')}
                    >
                        <span className="attachment-icon">{fileIcon(att.mime_type)}</span>
                        <span className="attachment-name">{att.original_filename}</span>
                    </span>
                )
            ))}
        </div>
    );
}

export default AttachmentList;
