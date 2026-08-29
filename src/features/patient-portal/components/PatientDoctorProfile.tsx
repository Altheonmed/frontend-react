import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import { PageHeader } from '../../../shared/components/PageHeader';
import { SectionCard, TabSkeleton } from '../../../shared/components/SectionCard';
import { usePageTitle } from '../../../shared/hooks/usePageTitle';
import { queryKeys } from '../../../shared/queryKeys';
import DoctorProfileView from '../../doctor-profile/components/DoctorProfileView';
import { doctorProfileService } from '../../doctor-profile/services/doctorProfileService';

/**
 * Patient-portal view of a doctor on the patient's care team
 * (/patient/doctor/:id). Same rendering as public discovery — previously this
 * page showed only contact details and duplicated the layout.
 */
export default function PatientDoctorProfile() {
    const { t } = useTranslation();
    usePageTitle(t('patient_portal.doctor_profile.document_title'));
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const doctorId = Number(id);

    const { data: doctor, isLoading, isError } = useQuery({
        queryKey: queryKeys.doctorProfile.patient(doctorId),
        queryFn: () => doctorProfileService.getPatientDoctorProfile(doctorId),
        enabled: !!doctorId,
        staleTime: 10 * 60_000,
    });

    return (
        <>
            <PageHeader
                title={isLoading ? t('patient_portal.common.loading') : doctor?.full_name ?? t('patient_portal.doctor_profile.title')}
                subtitle={doctor?.specialty
                    ? t(`specialties.${doctor.specialty}`, doctor.specialty_display ?? '')
                    : doctor?.specialty_display ?? undefined}
                actions={
                    <button className="btn btn-secondary btn-sm" onClick={() => navigate(-1)}>
                        {t('patient_portal.common.back')}
                    </button>
                }
            />

            {isLoading && <SectionCard title=""><TabSkeleton rows={4} /></SectionCard>}

            {isError && (
                <div className="error-message" style={{ margin: '0 0 1rem' }}>
                    {t('patient_portal.doctor_profile.error.load')}
                </div>
            )}

            {doctor && (
                <DoctorProfileView
                    doctor={doctor}
                    variant="patient"
                    actions={
                        <button
                            className="btn btn-primary"
                            onClick={() => navigate('/patient/appointments')}
                        >
                            {t('patient_portal.doctor_profile.book_appointment')}
                        </button>
                    }
                    actionsNote={t('patient_portal.doctor_profile.book_intro', { name: doctor.full_name })}
                />
            )}
        </>
    );
}
