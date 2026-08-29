import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import Avatar from '../../../shared/components/Avatar';
import { Modal } from '../../../shared/components/ui';
import { queryKeys } from '../../../shared/queryKeys';
import { SPECIALTY_VALUES } from '../../referrals/referralSchema';
import { doctorProfileService } from '../services/doctorProfileService';
import DoctorProfileView from './DoctorProfileView';
import type { ColleagueSummary } from '../types';
import './DoctorPicker.css';

/**
 * Searchable colleague picker for the referral flow.
 *
 * Replaces the plain <select> of names: a referring doctor can filter, open a
 * colleague's full profile inline (without leaving the half-filled referral
 * form) and then select them.
 */
export interface DoctorPickerProps {
    open: boolean;
    onClose: () => void;
    onSelect: (doctor: ColleagueSummary) => void;
    /** Exclude the referring doctor from their own picker. */
    excludeId?: number;
    initialSpecialty?: string;
}

export default function DoctorPicker({
    open, onClose, onSelect, excludeId, initialSpecialty = '',
}: DoctorPickerProps) {
    const { t } = useTranslation();
    const [search, setSearch] = useState('');
    const [specialty, setSpecialty] = useState(initialSpecialty);
    const [acceptingOnly, setAcceptingOnly] = useState(true);
    const [previewId, setPreviewId] = useState<number | null>(null);

    const params = { specialty, accepting_referrals: acceptingOnly };

    const { data: doctors = [], isLoading } = useQuery({
        queryKey: queryKeys.doctorProfile.colleagues(params),
        queryFn: () => doctorProfileService.listColleagues(params),
        enabled: open,
        staleTime: 60_000,
    });

    const { data: preview, isLoading: previewLoading } = useQuery({
        queryKey: queryKeys.doctorProfile.colleague(previewId ?? 0),
        queryFn: () => doctorProfileService.getColleagueProfile(previewId as number),
        enabled: previewId != null,
        staleTime: 5 * 60_000,
    });

    const filtered = useMemo(() => {
        const term = search.trim().toLowerCase();
        return doctors
            .filter(d => d.id !== excludeId)
            .filter(d => !term || d.full_name.toLowerCase().includes(term));
    }, [doctors, search, excludeId]);

    function reset() {
        setPreviewId(null);
        setSearch('');
    }

    function handleClose() {
        reset();
        onClose();
    }

    function handleSelect(doctor: ColleagueSummary) {
        onSelect(doctor);
        reset();
        onClose();
    }

    // ── Profile preview ──
    if (previewId != null) {
        const summary = doctors.find(d => d.id === previewId);
        return (
            <Modal
                open={open}
                onClose={handleClose}
                size="lg"
                title={preview?.full_name ?? t('doctorPicker.profileTitle')}
                footer={
                    <div className="docpicker__footer">
                        <button className="btn btn-secondary" onClick={() => setPreviewId(null)}>
                            ← {t('doctorPicker.backToList')}
                        </button>
                        {summary && (
                            <button className="btn btn-primary" onClick={() => handleSelect(summary)}>
                                {t('doctorPicker.referToThisDoctor')}
                            </button>
                        )}
                    </div>
                }
            >
                {previewLoading && <div className="docpicker__loading">{t('common.loading')}</div>}
                {preview && <DoctorProfileView doctor={preview} variant="colleague" compact showMap={false} />}
            </Modal>
        );
    }

    // ── List ──
    return (
        <Modal open={open} onClose={handleClose} size="lg" title={t('doctorPicker.title')}>
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
                    <input
                        type="checkbox"
                        checked={acceptingOnly}
                        onChange={e => setAcceptingOnly(e.target.checked)}
                    />
                    {t('referrals.form.accepting_only')}
                </label>
            </div>

            {isLoading && <div className="docpicker__loading">{t('common.loading')}</div>}

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
                            <button
                                type="button"
                                className="btn btn-secondary btn-sm"
                                onClick={() => setPreviewId(d.id)}
                            >
                                {t('doctorPicker.viewProfile')}
                            </button>
                            <button
                                type="button"
                                className="btn btn-primary btn-sm"
                                onClick={() => handleSelect(d)}
                            >
                                {t('doctorPicker.select')}
                            </button>
                        </div>
                    </li>
                ))}
            </ul>
        </Modal>
    );
}
