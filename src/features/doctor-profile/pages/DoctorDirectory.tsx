import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import Avatar from '../../../shared/components/Avatar';
import { PageHeader } from '../../../shared/components/PageHeader';
import { SectionCard, TabSkeleton } from '../../../shared/components/SectionCard';
import { usePageTitle } from '../../../shared/hooks/usePageTitle';
import { queryKeys } from '../../../shared/queryKeys';
import { SPECIALTY_VALUES } from '../../referrals/referralSchema';
import { doctorProfileService } from '../services/doctorProfileService';
import '../components/DoctorPicker.css';

/** Colleague directory (/doctors) — browse and open a doctor's full profile. */
export default function DoctorDirectory() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    usePageTitle(t('doctorDirectory.title'));

    const [search, setSearch] = useState('');
    const [specialty, setSpecialty] = useState('');
    const [acceptingOnly, setAcceptingOnly] = useState(false);

    const params = { specialty, accepting_referrals: acceptingOnly };
    const { data: doctors = [], isLoading } = useQuery({
        queryKey: queryKeys.doctorProfile.colleagues(params),
        queryFn: () => doctorProfileService.listColleagues(params),
        staleTime: 60_000,
    });

    const filtered = useMemo(() => {
        const term = search.trim().toLowerCase();
        return term ? doctors.filter(d => d.full_name.toLowerCase().includes(term)) : doctors;
    }, [doctors, search]);

    return (
        <>
            <PageHeader title={t('doctorDirectory.title')} subtitle={t('doctorDirectory.subtitle')} />

            <SectionCard>
                <div className="docpicker__filters">
                    <input
                        type="search"
                        className="input"
                        placeholder={t('doctorPicker.searchPlaceholder')}
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        aria-label={t('doctorPicker.searchPlaceholder')}
                    />
                    <select
                        className="input select-input"
                        value={specialty}
                        onChange={e => setSpecialty(e.target.value)}
                        aria-label={t('referrals.form.filter_specialty')}
                    >
                        <option value="">{t('referrals.form.all_specialties')}</option>
                        {SPECIALTY_VALUES.map(v => (
                            <option key={v} value={v}>{t(`specialties.${v}`, v)}</option>
                        ))}
                    </select>
                    <label className="docpicker__toggle">
                        <input type="checkbox" checked={acceptingOnly}
                               onChange={e => setAcceptingOnly(e.target.checked)} />
                        {t('referrals.form.accepting_only')}
                    </label>
                </div>

                {isLoading && <TabSkeleton rows={4} />}

                {!isLoading && filtered.length === 0 && (
                    <div className="docpicker__empty">
                        <p>{t('doctorPicker.noResults')}</p>
                        <p className="docpicker__empty-hint">{t('doctorPicker.noResultsHint')}</p>
                    </div>
                )}

                <ul className="docpicker__list">
                    {filtered.map(d => (
                        <li key={d.id} className="docpicker__row">
                            <Avatar name={d.full_name} src={d.avatar_url} size="md" />
                            <div className="docpicker__row-body">
                                <div className="docpicker__row-name">Dr. {d.full_name}</div>
                                <div className="docpicker__row-meta">
                                    {d.specialty_display || t(`specialties.${d.specialty}`, d.specialty)}
                                    {!d.accepting_referrals && (
                                        <span className="docpicker__closed">{t('doctorPicker.notAccepting')}</span>
                                    )}
                                </div>
                            </div>
                            <div className="docpicker__row-actions">
                                <button type="button" className="btn btn-secondary btn-sm"
                                        onClick={() => navigate(`/doctors/${d.id}`)}>
                                    {t('doctorPicker.viewProfile')}
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>
            </SectionCard>
        </>
    );
}
