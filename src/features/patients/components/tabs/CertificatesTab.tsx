// Medical certificates — sick-leave + examination certificates issued from
// the patient record. Certificates are immutable: mistakes are corrected by
// voiding and reissuing (the form pre-fills from the voided original).

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import api from '../../../../shared/services/api';
import { toast, parseApiError } from '../../../../shared/components/ui';
import { Icon } from '../../../../shared/components/Icons';
import { useFormatDateTime } from '../../../../shared/hooks/useUserTimezone';

export interface MedicalCertificate {
    id: number;
    certificate_type: 'sick_leave' | 'examination';
    status: 'issued' | 'voided';
    patient: string;
    patient_name: string;
    doctor_name: string;
    consultation: number | null;
    examination_date: string;
    diagnosis: string;
    icd10_code: string;
    leave_start_date: string | null;
    leave_days: number | null;
    leave_end_date: string | null;
    fitness_statement: string;
    remarks: string;
    place_of_issue: string;
    serial_number: string;
    verify_code: string;
    voided_at: string | null;
    void_reason: string;
    replaces: number | null;
    replaced_by_id: number | null;
    visible_to_patient: boolean;
    issued_at: string;
}

const LEAVE_PRESETS = [1, 2, 3, 5, 7, 14];

const FITNESS_OPTIONS = [
    'fit_for_work', 'fit_for_school', 'fit_for_travel',
    'fit_for_sport', 'unfit_temporary', 'other',
] as const;

interface Draft {
    certificate_type: 'sick_leave' | 'examination';
    examination_date: string;
    diagnosis: string;
    leave_start_date: string;
    leave_days: number;
    custom_days: string;
    fitness_statement: string;
    remarks: string;
    place_of_issue: string;
    visible_to_patient: boolean;
    replaces: number | null;
}

const emptyDraft = (): Draft => ({
    certificate_type: 'sick_leave',
    examination_date: new Date().toISOString().slice(0, 10),
    diagnosis: '',
    leave_start_date: new Date().toISOString().slice(0, 10),
    leave_days: 3,
    custom_days: '',
    fitness_statement: 'fit_for_work',
    remarks: '',
    place_of_issue: '',
    visible_to_patient: true,
    replaces: null,
});

export function CertificatesTab({ patientId, canWrite }: { patientId: string; canWrite: boolean }) {
    const { t } = useTranslation();
    const qc = useQueryClient();
    const { formatDate } = useFormatDateTime();
    const [showForm, setShowForm] = useState(false);
    const [draft, setDraft] = useState<Draft>(emptyDraft());
    const [submitting, setSubmitting] = useState(false);
    const [voidTargetId, setVoidTargetId] = useState<number | null>(null);
    const [voidReason, setVoidReason] = useState('');
    const [voiding, setVoiding] = useState(false);

    const { data: certificates = [], isLoading } = useQuery({
        queryKey: ['certificates', patientId],
        queryFn: async () =>
            (await api.get<MedicalCertificate[]>(`/certificates/?patient=${patientId}`)).data,
        staleTime: 30_000,
    });

    const effectiveDays = draft.custom_days !== '' ? Number(draft.custom_days) : draft.leave_days;

    const submit = async () => {
        setSubmitting(true);
        try {
            const payload: Record<string, unknown> = {
                certificate_type: draft.certificate_type,
                patient: patientId,
                examination_date: draft.examination_date,
                diagnosis: draft.diagnosis,
                remarks: draft.remarks,
                place_of_issue: draft.place_of_issue,
                visible_to_patient: draft.visible_to_patient,
            };
            if (draft.replaces) payload.replaces = draft.replaces;
            if (draft.certificate_type === 'sick_leave') {
                payload.leave_start_date = draft.leave_start_date;
                payload.leave_days = effectiveDays;
            } else {
                payload.fitness_statement = draft.fitness_statement;
            }
            await api.post('/certificates/', payload);
            toast.success(t('certificates.toast.issued', 'Certificate issued.'));
            setShowForm(false);
            setDraft(emptyDraft());
            qc.invalidateQueries({ queryKey: ['certificates', patientId] });
        } catch (e: unknown) {
            toast.error(parseApiError(e, t('certificates.toast.issue_failed', 'Could not issue certificate.')));
        } finally {
            setSubmitting(false);
        }
    };

    const voidCertificate = async () => {
        if (!voidTargetId || !voidReason.trim()) return;
        setVoiding(true);
        try {
            await api.post(`/certificates/${voidTargetId}/void/`, { reason: voidReason.trim() });
            toast.success(t('certificates.toast.voided', 'Certificate voided.'));
            setVoidTargetId(null);
            setVoidReason('');
            qc.invalidateQueries({ queryKey: ['certificates', patientId] });
        } catch (e: unknown) {
            toast.error(parseApiError(e, t('certificates.toast.void_failed', 'Could not void certificate.')));
        } finally {
            setVoiding(false);
        }
    };

    const reissue = (cert: MedicalCertificate) => {
        setDraft({
            certificate_type: cert.certificate_type,
            examination_date: cert.examination_date,
            diagnosis: cert.diagnosis,
            leave_start_date: cert.leave_start_date ?? new Date().toISOString().slice(0, 10),
            leave_days: cert.leave_days && LEAVE_PRESETS.includes(cert.leave_days) ? cert.leave_days : 3,
            custom_days: cert.leave_days && !LEAVE_PRESETS.includes(cert.leave_days) ? String(cert.leave_days) : '',
            fitness_statement: cert.fitness_statement || 'fit_for_work',
            remarks: cert.remarks,
            place_of_issue: cert.place_of_issue,
            visible_to_patient: cert.visible_to_patient,
            replaces: cert.id,
        });
        setShowForm(true);
    };

    // The PDF prints both languages; `lang` only decides which one leads.
    const downloadPdf = async (cert: MedicalCertificate, lang?: 'en' | 'fr') => {
        try {
            const path = `/certificates/${cert.id}/pdf/${lang ? `?lang=${lang}` : ''}`;
            const res = await api.get(path, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
            const a = document.createElement('a');
            a.href = url;
            a.download = `${cert.serial_number}.pdf`;
            a.click();
            window.URL.revokeObjectURL(url);
        } catch {
            toast.error(t('certificates.toast.pdf_failed', 'Could not download PDF.'));
        }
    };

    const typeLabel = (type: MedicalCertificate['certificate_type']) =>
        type === 'sick_leave'
            ? t('certificates.type.sick_leave', 'Sick Leave')
            : t('certificates.type.examination', 'Medical Examination');

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h2 style={{ margin: 0 }}>{t('certificates.title', 'Medical Certificates')}</h2>
                {canWrite && (
                    <button
                        type="button" className="btn btn-primary btn-sm"
                        onClick={() => { setDraft(emptyDraft()); setShowForm(s => !s); }}
                    >
                        <Icon name="plus" size={14} /> {t('certificates.issue', 'Issue certificate')}
                    </button>
                )}
            </div>

            {showForm && (
                <div style={{ background: 'var(--bg-subtle)', borderRadius: 12, padding: '1rem', marginBottom: '1rem' }}>
                    {draft.replaces && (
                        <p style={{ marginTop: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                            {t('certificates.form.reissue_note', 'Reissuing to replace voided certificate #{{id}}.', { id: draft.replaces })}
                        </p>
                    )}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                        <select
                            className="form-input" value={draft.certificate_type}
                            onChange={e => setDraft({ ...draft, certificate_type: e.target.value as Draft['certificate_type'] })}
                        >
                            <option value="sick_leave">{t('certificates.type.sick_leave', 'Sick Leave')}</option>
                            <option value="examination">{t('certificates.type.examination', 'Medical Examination')}</option>
                        </select>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem' }}>
                            {t('certificates.form.exam_date', 'Examination date')}
                            <input
                                className="form-input" type="date" value={draft.examination_date}
                                max={new Date().toISOString().slice(0, 10)}
                                onChange={e => setDraft({ ...draft, examination_date: e.target.value })}
                            />
                        </label>
                    </div>

                    {draft.certificate_type === 'sick_leave' ? (
                        <div style={{ marginTop: 8 }}>
                            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                                <span style={{ fontSize: '0.85rem' }}>{t('certificates.form.duration', 'Leave duration:')}</span>
                                {LEAVE_PRESETS.map(d => (
                                    <button
                                        key={d} type="button"
                                        className={`btn btn-sm ${draft.custom_days === '' && draft.leave_days === d ? 'btn-primary' : 'btn-ghost'}`}
                                        onClick={() => setDraft({ ...draft, leave_days: d, custom_days: '' })}
                                    >
                                        {t('certificates.form.days', '{{count}} day', { count: d })}
                                    </button>
                                ))}
                                <input
                                    className="form-input" type="number" min={1} max={365}
                                    placeholder={t('certificates.form.custom', 'Custom')}
                                    value={draft.custom_days}
                                    onChange={e => setDraft({ ...draft, custom_days: e.target.value })}
                                    style={{ width: 90 }}
                                />
                            </div>
                            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', marginTop: 8 }}>
                                {t('certificates.form.leave_start', 'Leave starts')}
                                <input
                                    className="form-input" type="date" value={draft.leave_start_date}
                                    onChange={e => setDraft({ ...draft, leave_start_date: e.target.value })}
                                />
                            </label>
                        </div>
                    ) : (
                        <select
                            className="form-input" style={{ marginTop: 8 }}
                            value={draft.fitness_statement}
                            onChange={e => setDraft({ ...draft, fitness_statement: e.target.value })}
                        >
                            {FITNESS_OPTIONS.map(f => (
                                <option key={f} value={f}>{t(`certificates.fitness.${f}`, f.replace(/_/g, ' '))}</option>
                            ))}
                        </select>
                    )}

                    <input
                        className="form-input" style={{ marginTop: 8 }}
                        placeholder={t('certificates.form.diagnosis', 'Diagnosis (optional — omitted from certificate if blank)')}
                        value={draft.diagnosis}
                        onChange={e => setDraft({ ...draft, diagnosis: e.target.value })}
                    />
                    <textarea
                        className="form-input" style={{ marginTop: 8 }} rows={2}
                        placeholder={t('certificates.form.remarks', 'Remarks (optional)')}
                        value={draft.remarks}
                        onChange={e => setDraft({ ...draft, remarks: e.target.value })}
                    />
                    <input
                        className="form-input" style={{ marginTop: 8 }}
                        placeholder={t('certificates.form.place', 'Place of issue (defaults to your practice city)')}
                        value={draft.place_of_issue}
                        onChange={e => setDraft({ ...draft, place_of_issue: e.target.value })}
                    />
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', marginTop: 8 }}>
                        <input
                            type="checkbox" checked={draft.visible_to_patient}
                            onChange={e => setDraft({ ...draft, visible_to_patient: e.target.checked })}
                        />
                        {t('certificates.form.visible', 'Visible in patient portal')}
                    </label>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
                        <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowForm(false)}>
                            {t('common.cancel', 'Cancel')}
                        </button>
                        <button
                            type="button" className="btn btn-primary btn-sm" onClick={submit}
                            disabled={submitting || (draft.certificate_type === 'sick_leave' && (!effectiveDays || effectiveDays < 1))}
                        >
                            {submitting ? t('common.saving', 'Saving…') : t('certificates.form.issue', 'Issue')}
                        </button>
                    </div>
                </div>
            )}

            {isLoading && <p>{t('common.loading', 'Loading…')}</p>}
            {!isLoading && certificates.length === 0 && (
                <p style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    {t('certificates.empty', 'No certificates issued for this patient.')}
                </p>
            )}
            {certificates.map(cert => (
                <div
                    key={cert.id}
                    style={{
                        border: '1px solid var(--border-default)', borderRadius: 12,
                        padding: '0.75rem 1rem', marginBottom: '0.6rem',
                        opacity: cert.status === 'voided' ? 0.65 : 1,
                    }}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: 8 }}>
                        <div>
                            <strong>{cert.serial_number}</strong> · {typeLabel(cert.certificate_type)}
                            {cert.status === 'voided' && (
                                <span style={{ color: 'var(--danger, #c0392b)', marginLeft: 8, fontWeight: 600 }}>
                                    {t('certificates.status.voided', 'VOIDED')}
                                </span>
                            )}
                        </div>
                        <div style={{ display: 'flex', gap: 6 }}>
                            <button type="button" className="btn btn-ghost btn-sm" onClick={() => downloadPdf(cert, 'fr')}>
                                {t('certificates.pdf_fr', 'PDF (FR)')}
                            </button>
                            <button type="button" className="btn btn-ghost btn-sm" onClick={() => downloadPdf(cert, 'en')}>
                                {t('certificates.pdf_en', 'PDF (EN)')}
                            </button>
                            {canWrite && cert.status === 'issued' && (
                                <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setVoidTargetId(cert.id); setVoidReason(''); }}>
                                    {t('certificates.void', 'Void')}
                                </button>
                            )}
                            {canWrite && cert.status === 'voided' && !cert.replaced_by_id && (
                                <button type="button" className="btn btn-ghost btn-sm" onClick={() => reissue(cert)}>
                                    {t('certificates.reissue', 'Reissue')}
                                </button>
                            )}
                        </div>
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 4 }}>
                        {t('certificates.card.examined', 'Examined {{date}}', { date: formatDate(cert.examination_date) })}
                        {cert.certificate_type === 'sick_leave' && cert.leave_start_date && (
                            <> · {t('certificates.card.leave', '{{days}} day(s) leave: {{start}} → {{end}}', {
                                days: cert.leave_days ?? 0, start: formatDate(cert.leave_start_date), end: formatDate(cert.leave_end_date!),
                            })}</>
                        )}
                        {cert.certificate_type === 'examination' && cert.fitness_statement && (
                            <> · {t(`certificates.fitness.${cert.fitness_statement}`, cert.fitness_statement.replace(/_/g, ' '))}</>
                        )}
                        {' '}· {t('certificates.card.by', 'Dr. {{name}}', { name: cert.doctor_name })}
                        {' '}· {t('certificates.card.code', 'Verify code: {{code}}', { code: cert.verify_code })}
                    </div>
                    {cert.status === 'voided' && cert.void_reason && (
                        <div style={{ fontSize: '0.8rem', color: 'var(--danger, #c0392b)', marginTop: 4 }}>
                            {t('certificates.card.void_reason', 'Void reason: {{reason}}', { reason: cert.void_reason })}
                            {cert.replaced_by_id && (
                                <> · {t('certificates.card.replaced_by', 'Replaced by certificate #{{id}}', { id: cert.replaced_by_id })}</>
                            )}
                        </div>
                    )}

                    {voidTargetId === cert.id && (
                        <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
                            <input
                                className="form-input" style={{ flex: 1 }}
                                placeholder={t('certificates.void_reason_placeholder', 'Reason for voiding (required)')}
                                value={voidReason}
                                onChange={e => setVoidReason(e.target.value)}
                            />
                            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setVoidTargetId(null)}>
                                {t('common.cancel', 'Cancel')}
                            </button>
                            <button
                                type="button" className="btn btn-danger btn-sm"
                                onClick={voidCertificate} disabled={voiding || !voidReason.trim()}
                            >
                                {t('certificates.confirm_void', 'Void certificate')}
                            </button>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}

export default CertificatesTab;
