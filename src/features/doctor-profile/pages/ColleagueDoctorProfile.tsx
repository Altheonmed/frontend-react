import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import { PageHeader } from '../../../shared/components/PageHeader';
import { SectionCard, TabSkeleton } from '../../../shared/components/SectionCard';
import { usePageTitle } from '../../../shared/hooks/usePageTitle';
import { queryKeys } from '../../../shared/queryKeys';
import DoctorProfileView from '../components/DoctorProfileView';
import { doctorProfileService } from '../services/doctorProfileService';

/**
 * Doctor-to-doctor profile (/doctors/:id) — the referral decision surface.
 * Shows the colleague-only block (licence, registering body, direct line,
 * referral availability) that the public profile withholds.
 */
export default function ColleagueDoctorProfile() {
    const { t } = useTranslation();
    const { id } = useParams<{ id: string }>();
    const doctorId = Number(id);
    const navigate = useNavigate();

    const { data: doctor, isLoading, isError } = useQuery({
        queryKey: queryKeys.doctorProfile.colleague(doctorId),
        queryFn: () => doctorProfileService.getColleagueProfile(doctorId),
        enabled: !!doctorId,
        staleTime: 5 * 60_000,
    });

    usePageTitle(doctor?.full_name ?? t('doctorDirectory.profileTitle'));

    return (
        <>
            <PageHeader
                title={doctor?.full_name ?? t('doctorDirectory.profileTitle')}
                subtitle={doctor?.specialty
                    ? t(`specialties.${doctor.specialty}`, doctor.specialty_display ?? '')
                    : doctor?.specialty_display ?? undefined}
                actions={
                    <button className="btn btn-secondary btn-sm" onClick={() => navigate('/doctors')}>
                        ← {t('doctorDirectory.backToDirectory')}
                    </button>
                }
            />

            {isLoading && <SectionCard title=""><TabSkeleton rows={4} /></SectionCard>}

            {isError && (
                <div className="error-message">{t('doctorDirectory.loadError')}</div>
            )}

            {doctor && <DoctorProfileView doctor={doctor} variant="colleague" />}
        </>
    );
}
