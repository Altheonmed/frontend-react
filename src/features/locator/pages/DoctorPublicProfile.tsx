import { useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import { usePageTitle } from '../../../shared/hooks/usePageTitle';
import { queryKeys } from '../../../shared/queryKeys';
import { useAuth } from '../../auth/hooks/useAuth';
import RequestAppointmentModal from '../../patient-portal/components/RequestAppointmentModal';
import DoctorProfileView from '../../doctor-profile/components/DoctorProfileView';
import { doctorProfileService } from '../../doctor-profile/services/doctorProfileService';
import './FindDoctors.css';

/**
 * Public discovery profile (/find-doctors/:id).
 * Rendering lives in the shared DoctorProfileView; this page owns the fetch,
 * the "back to search" affordance and the booking call-to-action.
 */
export default function DoctorPublicProfile() {
    const { t } = useTranslation();
    const { id } = useParams<{ id: string }>();
    const doctorId = Number(id);
    const navigate = useNavigate();
    const location = useLocation();
    const { isAuthenticated, userType } = useAuth();

    const { data: doctor, isLoading, isError } = useQuery({
        queryKey: queryKeys.doctorProfile.public(doctorId),
        queryFn: () => doctorProfileService.getPublicProfile(doctorId),
        enabled: !!doctorId,
        staleTime: 5 * 60_000,
    });

    usePageTitle(doctor?.full_name ?? t('findDoctors.profile.title'));

    const [bookingOpen, setBookingOpen] = useState(false);
    // Arriving from the "Online consultation" search (?type=video) pre-selects
    // a telemedicine visit in the booking modal.
    const bookingType: 'in_person' | 'telemedicine' =
        new URLSearchParams(location.search).get('type') === 'video' ? 'telemedicine' : 'in_person';

    function onBookClick() {
        if (isAuthenticated && userType === 'patient') {
            setBookingOpen(true);
        } else {
            navigate(`/patient/login?next=${encodeURIComponent(location.pathname)}`);
        }
    }

    if (isLoading) {
        return (
            <div className="locator">
                <div className="locator__loading-card" style={{ height: 110 }} />
                <div className="locator__loading-card" style={{ height: 220 }} />
            </div>
        );
    }

    if (isError || !doctor) {
        return (
            <div className="locator">
                <div className="error-message">{t('findDoctors.profile.notFound')}</div>
                <button className="btn btn-secondary btn-sm" onClick={() => navigate('/find-doctors')}>
                    {t('findDoctors.backToSearch')}
                </button>
            </div>
        );
    }

    return (
        <div className="locator">
            <button className="btn btn-secondary btn-sm docprofile__back" onClick={() => navigate('/find-doctors')}>
                ← {t('findDoctors.backToSearch')}
            </button>

            <DoctorProfileView
                doctor={doctor}
                variant="public"
                actions={
                    <button className="btn btn-primary" onClick={onBookClick}>
                        {t('findDoctors.booking.cta')}
                    </button>
                }
                actionsNote={isAuthenticated && userType === 'patient'
                    ? t('findDoctors.booking.hintLoggedIn')
                    : t('findDoctors.booking.hintAnon')}
            />

            <RequestAppointmentModal
                open={bookingOpen}
                onClose={() => setBookingOpen(false)}
                lockedDoctorId={doctorId}
                lockedDoctorName={doctor.full_name}
                defaultAppointmentType={bookingType}
            />
        </div>
    );
}
