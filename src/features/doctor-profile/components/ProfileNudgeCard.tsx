import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '../../../shared/queryKeys';
import { doctorProfileService } from '../services/doctorProfileService';
import './ProfileNudge.css';

const SNOOZE_DAYS = 14;

/**
 * Dashboard nudge to finish the public profile.
 *
 * Deliberately a dismissible inline card rather than a modal: it should be
 * easy to ignore on a clinical dashboard. Hidden once the profile is
 * essentially complete, while snoozed, or after the wizard is finished.
 */
export default function ProfileNudgeCard() {
    const { t } = useTranslation();
    const qc = useQueryClient();

    const { data } = useQuery({
        queryKey: queryKeys.doctorProfile.completeness(),
        queryFn: doctorProfileService.getCompleteness,
        staleTime: 5 * 60_000,
    });

    const snooze = useMutation({
        mutationFn: () => doctorProfileService.snoozePrompt(SNOOZE_DAYS),
        onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.doctorProfile.completeness() }),
    });

    if (!data) return null;
    if (data.completeness >= 80) return null;
    if (data.prompt_dismissed_until && new Date(data.prompt_dismissed_until) > new Date()) return null;

    return (
        <div className="profile-nudge" role="status">
            <div className="profile-nudge__body">
                <div className="profile-nudge__title">
                    {t('doctorProfile.nudge.title', { pct: data.completeness })}
                </div>
                <p className="profile-nudge__text">{t('doctorProfile.nudge.body')}</p>
                <div className="profile-nudge__bar" aria-hidden="true">
                    <div className="profile-nudge__fill" style={{ width: `${data.completeness}%` }} />
                </div>
            </div>
            <div className="profile-nudge__actions">
                <Link to="/profile/setup" className="btn btn-primary btn-sm">
                    {t('doctorProfile.nudge.cta')}
                </Link>
                <button type="button" className="btn btn-ghost btn-sm"
                        onClick={() => snooze.mutate()} disabled={snooze.isPending}>
                    {t('doctorProfile.nudge.dismiss')}
                </button>
            </div>
        </div>
    );
}
