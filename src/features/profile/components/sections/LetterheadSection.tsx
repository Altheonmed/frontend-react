// Letterhead & signing — what gets printed on generated documents
// (medical certificates today). Blank text fields fall back to the doctor's
// primary practice location; the resolved preview shows what will print.

import { useEffect, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import api from '../../../../shared/services/api';
import { toast, parseApiError } from '../../../../shared/components/ui';

type AssetKind = 'logo' | 'signature' | 'stamp';

interface Letterhead {
    clinic_name: string;
    clinic_email: string;
    clinic_website: string;
    registration_authority: string;
    logo_url: string | null;
    signature_url: string | null;
    stamp_url: string | null;
    resolved: {
        name: string;
        address: string;
        phone: string;
        email: string;
        website: string;
        city: string;
        doctor_name: string;
        license_number: string;
        registration_authority: string;
        specialty: string;
    };
}

export default function LetterheadSection() {
    const { t } = useTranslation();
    const qc = useQueryClient();
    const [form, setForm] = useState({
        clinic_name: '', clinic_email: '', clinic_website: '', registration_authority: '',
    });
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState<AssetKind | null>(null);
    const fileInputs = {
        logo: useRef<HTMLInputElement>(null),
        signature: useRef<HTMLInputElement>(null),
        stamp: useRef<HTMLInputElement>(null),
    };

    const { data, isLoading } = useQuery({
        queryKey: ['letterhead'],
        queryFn: async () => (await api.get<Letterhead>('/profile/letterhead/')).data,
        staleTime: 60_000,
    });

    useEffect(() => {
        if (!data) return;
        setForm({
            clinic_name: data.clinic_name || '',
            clinic_email: data.clinic_email || '',
            clinic_website: data.clinic_website || '',
            registration_authority: data.registration_authority || '',
        });
    }, [data]);

    const save = async () => {
        setSaving(true);
        try {
            await api.patch('/profile/letterhead/', form);
            qc.invalidateQueries({ queryKey: ['letterhead'] });
            toast.success(t('settings.letterhead.saved', 'Letterhead updated.'));
        } catch (err) {
            toast.error(parseApiError(err, t('settings.letterhead.save_error', 'Could not save letterhead.')));
        } finally {
            setSaving(false);
        }
    };

    const upload = async (kind: AssetKind, file: File) => {
        setUploading(kind);
        try {
            const fd = new FormData();
            fd.append(kind, file);
            await api.post('/profile/letterhead/', fd);
            qc.invalidateQueries({ queryKey: ['letterhead'] });
            toast.success(t('settings.letterhead.uploaded', 'Image uploaded.'));
        } catch (err) {
            toast.error(parseApiError(err, t('settings.letterhead.upload_error', 'Could not upload image.')));
        } finally {
            setUploading(null);
        }
    };

    const remove = async (kind: AssetKind) => {
        try {
            await api.delete(`/profile/letterhead/?asset=${kind}`);
            qc.invalidateQueries({ queryKey: ['letterhead'] });
        } catch (err) {
            toast.error(parseApiError(err, t('settings.letterhead.remove_error', 'Could not remove image.')));
        }
    };

    const assetCard = (kind: AssetKind, url: string | null, label: string, hint: string) => (
        <div className="form-group" key={kind}>
            <label>{label}</label>
            <div style={{
                border: '1px dashed var(--border-default)', borderRadius: 'var(--radius-md)',
                padding: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.75rem',
                minHeight: 84,
            }}>
                {url ? (
                    <img
                        src={url} alt={label}
                        style={{ maxHeight: 60, maxWidth: 140, objectFit: 'contain' }}
                    />
                ) : (
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {t('settings.letterhead.none', 'Not set')}
                    </span>
                )}
                <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.4rem' }}>
                    <button
                        type="button" className="btn btn-ghost btn-sm"
                        disabled={uploading === kind}
                        onClick={() => fileInputs[kind].current?.click()}
                    >
                        {uploading === kind
                            ? t('common.uploading', 'Uploading…')
                            : url ? t('settings.letterhead.replace', 'Replace') : t('settings.letterhead.upload', 'Upload')}
                    </button>
                    {url && (
                        <button type="button" className="btn btn-ghost btn-sm" onClick={() => remove(kind)}>
                            {t('common.remove', 'Remove')}
                        </button>
                    )}
                </div>
                <input
                    ref={fileInputs[kind]} type="file" accept="image/*" hidden
                    onChange={e => {
                        const f = e.target.files?.[0];
                        if (f) upload(kind, f);
                        e.target.value = '';
                    }}
                />
            </div>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{hint}</span>
        </div>
    );

    return (
        <div className="settings-card">
            <div className="settings-card-head">
                <h2 className="settings-card-title">{t('settings.letterhead.title', 'Letterhead & signing')}</h2>
                <p className="settings-card-subtitle">
                    {t('settings.letterhead.subtitle',
                        'Printed on medical certificates and other generated documents.')}
                </p>
            </div>

            <div className="settings-card-body">
                <div className="settings-grid-2">
                    <div className="form-group">
                        <label htmlFor="clinic_name">{t('settings.letterhead.clinic_name', 'Clinic name')}</label>
                        <input
                            id="clinic_name" type="text" className="input"
                            placeholder={data?.resolved.name || ''}
                            value={form.clinic_name}
                            onChange={e => setForm({ ...form, clinic_name: e.target.value })}
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="registration_authority">
                            {t('settings.letterhead.registration_authority', 'Registration authority')}
                        </label>
                        <input
                            id="registration_authority" type="text" className="input"
                            placeholder="Ordre des Médecins"
                            value={form.registration_authority}
                            onChange={e => setForm({ ...form, registration_authority: e.target.value })}
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="clinic_email">{t('settings.letterhead.clinic_email', 'Contact email')}</label>
                        <input
                            id="clinic_email" type="email" className="input"
                            placeholder={data?.resolved.email || ''}
                            value={form.clinic_email}
                            onChange={e => setForm({ ...form, clinic_email: e.target.value })}
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="clinic_website">{t('settings.letterhead.clinic_website', 'Website')}</label>
                        <input
                            id="clinic_website" type="text" className="input"
                            placeholder="www.example.com"
                            value={form.clinic_website}
                            onChange={e => setForm({ ...form, clinic_website: e.target.value })}
                        />
                    </div>
                </div>

                <div style={{ marginTop: '0.5rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border-subtle)' }}>
                    <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 0.25rem' }}>
                        {t('settings.letterhead.assets_title', 'Logo, signature & stamp')}
                    </h3>
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '0 0 1rem' }}>
                        {t('settings.letterhead.assets_subtitle',
                            'Upload a signature and stamp to have documents signed electronically. '
                            + 'Without them, certificates print with a blank signature line to sign by hand.')}
                    </p>
                    <div className="settings-grid-2">
                        {assetCard('logo', data?.logo_url ?? null,
                            t('settings.letterhead.logo', 'Clinic logo'),
                            t('settings.letterhead.logo_hint', 'PNG with a transparent background works best.'))}
                        {assetCard('signature', data?.signature_url ?? null,
                            t('settings.letterhead.signature', 'Signature'),
                            t('settings.letterhead.signature_hint', 'Sign on white paper, photograph it, and remove the background if you can.'))}
                        {assetCard('stamp', data?.stamp_url ?? null,
                            t('settings.letterhead.stamp', 'Official stamp'),
                            t('settings.letterhead.stamp_hint', 'Scanned practice stamp.'))}
                    </div>
                </div>

                {!isLoading && data && (
                    <div style={{
                        marginTop: '0.5rem', padding: '0.75rem 0.9rem', borderRadius: 'var(--radius-md)',
                        background: 'var(--bg-subtle)', fontSize: '0.8rem', color: 'var(--text-muted)',
                    }}>
                        <strong style={{ color: 'var(--text-primary)' }}>
                            {t('settings.letterhead.preview_title', 'What will print:')}
                        </strong>
                        <div style={{ marginTop: '0.35rem', lineHeight: 1.6 }}>
                            {data.resolved.name}<br />
                            {data.resolved.address || t('settings.letterhead.no_address', 'No address on file — add a practice location.')}<br />
                            {[data.resolved.phone, data.resolved.email, data.resolved.website].filter(Boolean).join(' · ')}<br />
                            Dr. {data.resolved.doctor_name}
                            {data.resolved.license_number ? ` · ${data.resolved.license_number}` : ''}
                        </div>
                    </div>
                )}
            </div>

            <div className="settings-card-footer">
                <button type="button" className="btn btn-primary btn-sm" disabled={saving} onClick={save}>
                    {saving ? t('common.saving', 'Saving…') : t('settings.save_changes', 'Save changes')}
                </button>
            </div>
        </div>
    );
}
