// Patient-facing medical certificates: list + PDF download.
// Only issued, patient-visible certificates are returned by the backend.

import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '../../../shared/components/PageHeader';
import { SectionCard, TabSkeleton } from '../../../shared/components/SectionCard';
import { usePageTitle } from '../../../shared/hooks/usePageTitle';
import { queryKeys } from '../../../shared/queryKeys';
import api from '../../../shared/services/api';
import { toast } from '../../../shared/components/ui';
import { formatPortalDate } from '../utils/i18n';

interface PortalCertificate {
    id: number;
    certificate_type: 'sick_leave' | 'examination';
    examination_date: string;
    leave_start_date: string | null;
    leave_days: number | null;
    leave_end_date: string | null;
    fitness_statement: string;
    serial_number: string;
    verify_code: string;
    doctor_name: string;
    issued_at: string;
}

export default function PatientCertificates({ asTab = false }: { asTab?: boolean }) {
    const { t, i18n } = useTranslation();
    usePageTitle(t('patient_portal.certificates.document_title', 'My Certificates'));

    const { data: certificates = [], isLoading, isError } = useQuery({
        queryKey: queryKeys.patientPortal.certificates(),
        queryFn: async () => (await api.get<PortalCertificate[]>('/patient/certificates/')).data,
        staleTime: 2 * 60_000,
    });

    const download = async (cert: PortalCertificate) => {
        try {
            const res = await api.get(`/patient/certificates/${cert.id}/pdf/`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
            const a = document.createElement('a');
            a.href = url;
            a.download = `${cert.serial_number}.pdf`;
            a.click();
            window.URL.revokeObjectURL(url);
        } catch {
            toast.error(t('patient_portal.certificates.error.download', 'Could not download the certificate.'));
        }
    };

    if (isLoading) {
        return (
            <>
                {!asTab && <PageHeader title={t('patient_portal.certificates.title', 'Medical Certificates')} subtitle="" />}
                <SectionCard title={t('patient_portal.common.loading')}><TabSkeleton rows={3} /></SectionCard>
            </>
        );
    }
    if (isError) {
        return (
            <>
                {!asTab && <PageHeader title={t('patient_portal.certificates.title', 'Medical Certificates')} subtitle="" />}
                <div className="error-message" style={{ margin: '1rem' }}>
                    {t('patient_portal.certificates.error.load', 'Could not load your certificates.')}
                </div>
            </>
        );
    }

    return (
        <>
            {!asTab && (
                <PageHeader
                    title={t('patient_portal.certificates.title', 'Medical Certificates')}
                    subtitle={t('patient_portal.certificates.subtitle', 'Certificates issued to you by your doctors')}
                />
            )}
            <SectionCard title={t('patient_portal.certificates.section', 'Your certificates')}>
                {certificates.length === 0 && (
                    <p style={{ color: 'var(--text-muted)', padding: '1rem 0' }}>
                        {t('patient_portal.certificates.empty', 'No certificates have been issued to you yet.')}
                    </p>
                )}
                {certificates.map(cert => (
                    <div
                        key={cert.id}
                        style={{
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            gap: 12, flexWrap: 'wrap', padding: '0.75rem 0',
                            borderBottom: '1px solid var(--border-default)',
                        }}
                    >
                        <div>
                            <strong>
                                {cert.certificate_type === 'sick_leave'
                                    ? t('patient_portal.certificates.type.sick_leave', 'Sick Leave Certificate')
                                    : t('patient_portal.certificates.type.examination', 'Medical Examination Certificate')}
                            </strong>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                {cert.serial_number}
                                {' · '}
                                {t('patient_portal.certificates.issued_by', 'Issued by Dr. {{name}} on {{date}}', {
                                    name: cert.doctor_name,
                                    date: formatPortalDate(cert.issued_at, i18n.language),
                                })}
                                {cert.certificate_type === 'sick_leave' && cert.leave_start_date && (
                                    <>
                                        {' · '}
                                        {t('patient_portal.certificates.leave_period', '{{days}} day(s): {{start}} – {{end}}', {
                                            days: cert.leave_days ?? 0,
                                            start: formatPortalDate(cert.leave_start_date, i18n.language),
                                            end: formatPortalDate(cert.leave_end_date!, i18n.language),
                                        })}
                                    </>
                                )}
                            </div>
                        </div>
                        <button type="button" className="btn btn-primary btn-sm" onClick={() => download(cert)}>
                            {t('patient_portal.certificates.download', 'Download PDF')}
                        </button>
                    </div>
                ))}
            </SectionCard>
        </>
    );
}
