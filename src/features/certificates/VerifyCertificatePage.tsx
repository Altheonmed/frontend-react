// Public certificate verification page — the target of the QR code / short
// code printed on every medical certificate. No authentication required.
// The backend deliberately returns no diagnosis and no patient identifiers
// beyond the name already printed on the paper document.

import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../../shared/services/api';

interface VerifyResult {
    status: 'issued' | 'voided';
    certificate_type: 'sick_leave' | 'examination';
    serial_number: string;
    patient_name: string;
    doctor_name: string;
    examination_date: string;
    issued_at: string;
    leave_start_date?: string;
    leave_end_date?: string;
    leave_days?: number;
    fitness_statement?: string;
}

export default function VerifyCertificatePage() {
    const { t } = useTranslation();
    const { code: codeParam } = useParams<{ code: string }>();
    const [code, setCode] = useState(codeParam ?? '');
    const [result, setResult] = useState<VerifyResult | null>(null);
    const [state, setState] = useState<'idle' | 'loading' | 'ok' | 'not_found' | 'error'>('idle');

    const check = async (value: string) => {
        const trimmed = value.trim();
        if (!trimmed) return;
        setState('loading');
        setResult(null);
        try {
            const res = await api.get<VerifyResult>(`/certificates/verify/${encodeURIComponent(trimmed)}/`);
            setResult(res.data);
            setState('ok');
        } catch (e: unknown) {
            const status = (e as { response?: { status?: number } })?.response?.status;
            setState(status === 404 ? 'not_found' : 'error');
        }
    };

    useEffect(() => {
        if (codeParam) check(codeParam);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [codeParam]);

    const row = (label: string, value: React.ReactNode) => (
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, padding: '0.5rem 0', borderBottom: '1px solid var(--border-default, #eee)' }}>
            <span style={{ color: 'var(--text-muted, #666)' }}>{label}</span>
            <strong style={{ textAlign: 'right' }}>{value}</strong>
        </div>
    );

    return (
        <div style={{ maxWidth: 560, margin: '3rem auto', padding: '0 1rem', fontFamily: 'inherit' }}>
            <h1 style={{ fontSize: '1.4rem' }}>{t('verify_certificate.title', 'Verify a Medical Certificate')}</h1>
            <p style={{ color: 'var(--text-muted, #666)' }}>
                {t('verify_certificate.intro', 'Enter the verification code printed on the certificate (e.g. 7K3F-92QD).')}
            </p>
            <form
                onSubmit={e => { e.preventDefault(); check(code); }}
                style={{ display: 'flex', gap: 8, margin: '1rem 0' }}
            >
                <input
                    className="form-input"
                    style={{ flex: 1, padding: '0.6rem', textTransform: 'uppercase' }}
                    value={code}
                    onChange={e => setCode(e.target.value)}
                    placeholder="XXXX-XXXX"
                    aria-label={t('verify_certificate.code_label', 'Verification code')}
                />
                <button type="submit" className="btn btn-primary" disabled={state === 'loading' || !code.trim()}>
                    {state === 'loading' ? t('verify_certificate.checking', 'Checking…') : t('verify_certificate.check', 'Verify')}
                </button>
            </form>

            {state === 'not_found' && (
                <div className="error-message" role="alert" style={{ padding: '1rem', borderRadius: 8, background: '#fdecea', color: '#c0392b' }}>
                    {t('verify_certificate.not_found', 'No certificate matches this code. Check the code and try again.')}
                </div>
            )}
            {state === 'error' && (
                <div className="error-message" role="alert" style={{ padding: '1rem', borderRadius: 8, background: '#fdecea', color: '#c0392b' }}>
                    {t('verify_certificate.error', 'Verification is temporarily unavailable. Please try again shortly.')}
                </div>
            )}

            {state === 'ok' && result && (
                <div style={{ border: '1px solid var(--border-default, #ddd)', borderRadius: 12, padding: '1rem 1.25rem' }}>
                    <div
                        role="status"
                        style={{
                            padding: '0.6rem 1rem', borderRadius: 8, marginBottom: '0.75rem', fontWeight: 700,
                            background: result.status === 'issued' ? '#e8f7ee' : '#fdecea',
                            color: result.status === 'issued' ? '#1e7e46' : '#c0392b',
                        }}
                    >
                        {result.status === 'issued'
                            ? t('verify_certificate.valid', '✓ Valid certificate')
                            : t('verify_certificate.voided', '✗ This certificate has been VOIDED and is no longer valid')}
                    </div>
                    {row(t('verify_certificate.serial', 'Certificate Nº'), result.serial_number)}
                    {row(
                        t('verify_certificate.type', 'Type'),
                        result.certificate_type === 'sick_leave'
                            ? t('verify_certificate.type_sick_leave', 'Medical Leave (Sick Leave)')
                            : t('verify_certificate.type_examination', 'Medical Examination'),
                    )}
                    {row(t('verify_certificate.patient', 'Patient'), result.patient_name)}
                    {row(t('verify_certificate.doctor', 'Issued by'), `Dr. ${result.doctor_name}`)}
                    {row(t('verify_certificate.exam_date', 'Examination date'), result.examination_date)}
                    {result.certificate_type === 'sick_leave' && result.leave_start_date && (
                        row(
                            t('verify_certificate.leave', 'Medical leave'),
                            t('verify_certificate.leave_value', '{{days}} day(s): {{start}} – {{end}}', {
                                days: result.leave_days ?? 0, start: result.leave_start_date, end: result.leave_end_date,
                            }),
                        )
                    )}
                    {row(t('verify_certificate.issued_on', 'Issued on'), result.issued_at)}
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted, #666)', marginTop: '0.75rem', marginBottom: 0 }}>
                        {t('verify_certificate.privacy_note', 'For privacy, medical details are never shown here. Only validity, dates and the issuing doctor are disclosed.')}
                    </p>
                </div>
            )}
        </div>
    );
}
