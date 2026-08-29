import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { toast, parseApiError } from '../../../shared/components/ui';
import { queryKeys } from '../../../shared/queryKeys';
import { doctorProfileService } from '../services/doctorProfileService';
import { useDoctorProfile } from '../../profile/hooks/useDoctorProfile';

/**
 * Completeness score + the publish switch.
 *
 * Publishing is gated server-side on `can_publish`; the toggle stays disabled
 * until that is true so the doctor sees the requirement rather than a 400.
 */
export default function ProfileCompletenessMeter({ compact = false }: { compact?: boolean }) {
    const { t } = useTranslation();
    const qc = useQueryClient();
    const { saveProfile } = useDoctorProfile();

    const { data, isLoading } = useQuery({
        queryKey: queryKeys.doctorProfile.completeness(),
        queryFn: doctorProfileService.getCompleteness,
    });

    const publish = useMutation({
        mutationFn: (next: boolean) => saveProfile({ profile_published: next }),
        onSuccess: (_res, next) => {
            toast.success(next ? t('doctorProfile.published') : t('doctorProfile.unpublished'));
            qc.invalidateQueries({ queryKey: queryKeys.doctorProfile.completeness() });
        },
        onError: (err) => toast.error(parseApiError(err, t('doctorProfile.saveError'))),
    });

    if (isLoading || !data) return null;

    const pct = data.completeness;
    const tone = pct >= 80 ? 'ok' : pct >= 40 ? 'warn' : 'low';

    return (
        <div className={`completeness completeness--${tone}${compact ? ' completeness--compact' : ''}`}>
            <div className="completeness__head">
                <span className="completeness__label">{t('doctorProfile.completeness.title')}</span>
                <span className="completeness__pct">{pct}%</span>
            </div>

            <div
                className="completeness__bar"
                role="progressbar"
                aria-valuenow={pct}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={t('doctorProfile.completeness.title')}
            >
                <div className="completeness__fill" style={{ width: `${pct}%` }} />
            </div>

            {data.missing.length > 0 && (
                <p className="completeness__missing">
                    {t('doctorProfile.completeness.missing')}{' '}
                    {data.missing.map(m => t(`doctorProfile.parts.${m}`, m)).join(', ')}
                </p>
            )}

            {!compact && (
                <div className="completeness__publish">
                    <label className="proflist__check" htmlFor="profile_published">
                        <input
                            id="profile_published"
                            type="checkbox"
                            checked={data.profile_published}
                            disabled={!data.can_publish || publish.isPending}
                            onChange={e => publish.mutate(e.target.checked)}
                        />
                        {t('doctorProfile.completeness.publish')}
                    </label>
                    {!data.can_publish && (
                        <p className="completeness__gate">{t('doctorProfile.completeness.publishGate')}</p>
                    )}
                </div>
            )}
        </div>
    );
}
