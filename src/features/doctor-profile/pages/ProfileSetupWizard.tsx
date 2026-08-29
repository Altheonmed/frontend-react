import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import { PageHeader } from '../../../shared/components/PageHeader';
import '../../../shared/styles/settings-ui.css';
import { toast, parseApiError } from '../../../shared/components/ui';
import { usePageTitle } from '../../../shared/hooks/usePageTitle';
import { queryKeys } from '../../../shared/queryKeys';
import { useDoctorProfile } from '../../profile/hooks/useDoctorProfile';
import TagInput from '../components/TagInput';
import ProfileListEditor from '../components/ProfileListEditor';
import ProfileCompletenessMeter from '../components/ProfileCompletenessMeter';
import { doctorProfileService } from '../services/doctorProfileService';
import type { DoctorQualification, DoctorExperience, DoctorService, DoctorInsurance } from '../types';
import '../components/ProfileEditor.css';
import './ProfileSetupWizard.css';

const STEPS = ['about', 'qualifications', 'experience', 'offerings'] as const;

const QUALIFICATION_KINDS = [
    'degree', 'board_certification', 'fellowship', 'residency',
    'training', 'membership', 'award',
] as const;

/**
 * Post-approval profile wizard (/profile/setup).
 *
 * Shown at the moment a doctor has the most reason to invest effort — just
 * after admin approval, when they want patients and referrals. Every step is
 * skippable and each save writes straight through to the same endpoints the
 * settings section uses, so the wizard is resumable and never holds data
 * hostage in local state.
 */
export default function ProfileSetupWizard() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const qc = useQueryClient();
    const { profile, saveProfile } = useDoctorProfile();
    usePageTitle(t('doctorProfile.wizard.title'));

    const [step, setStep] = useState(0);
    const [saving, setSaving] = useState(false);
    const [about, setAbout] = useState({
        professional_title: '', bio: '',
        years_of_experience: '' as string | number,
        languages_spoken: [] as string[],
    });

    useEffect(() => {
        if (!profile) return;
        const p = profile as unknown as Record<string, unknown>;
        setAbout({
            professional_title: (p.professional_title as string) ?? '',
            bio: (p.bio as string) ?? '',
            years_of_experience: (p.years_of_experience as number) ?? '',
            languages_spoken: (p.languages_spoken as string[]) ?? [],
        });
    }, [profile]);

    const qualifications = useQuery({
        queryKey: queryKeys.doctorProfile.qualifications(),
        queryFn: doctorProfileService.listQualifications,
    });
    const experiences = useQuery({
        queryKey: queryKeys.doctorProfile.experiences(),
        queryFn: doctorProfileService.listExperiences,
    });
    const services = useQuery({
        queryKey: queryKeys.doctorProfile.services(),
        queryFn: doctorProfileService.listServices,
    });
    const insurances = useQuery({
        queryKey: queryKeys.doctorProfile.insurances(),
        queryFn: doctorProfileService.listInsurances,
    });

    async function saveAbout() {
        setSaving(true);
        try {
            await saveProfile({
                ...about,
                years_of_experience: about.years_of_experience === '' ? null : Number(about.years_of_experience),
            });
            qc.invalidateQueries({ queryKey: queryKeys.doctorProfile.completeness() });
        } catch (err) {
            toast.error(parseApiError(err, t('doctorProfile.saveError')));
            return false;
        } finally {
            setSaving(false);
        }
        return true;
    }

    async function next() {
        if (step === 0 && !(await saveAbout())) return;
        setStep(s => Math.min(s + 1, STEPS.length - 1));
    }

    async function finish() {
        if (step === 0 && !(await saveAbout())) return;
        try {
            await doctorProfileService.markProfileCompleted();
            qc.invalidateQueries({ queryKey: queryKeys.doctorProfile.completeness() });
            toast.success(t('doctorProfile.wizard.finished'));
            navigate('/settings?section=professional');
        } catch (err) {
            toast.error(parseApiError(err, t('doctorProfile.saveError')));
        }
    }

    const isLast = step === STEPS.length - 1;

    return (
        <>
            <PageHeader
                title={t('doctorProfile.wizard.title')}
                subtitle={t('doctorProfile.wizard.subtitle')}
                actions={
                    <button className="btn btn-secondary btn-sm" onClick={() => navigate('/dashboard')}>
                        {t('doctorProfile.wizard.later')}
                    </button>
                }
            />

            <div className="settings-card">
                <div className="settings-card-body">
                <ol className="wizard__steps" aria-label={t('doctorProfile.wizard.title')}>
                    {STEPS.map((s, i) => (
                        <li
                            key={s}
                            className={`wizard__step${i === step ? ' wizard__step--active' : ''}${i < step ? ' wizard__step--done' : ''}`}
                            aria-current={i === step ? 'step' : undefined}
                        >
                            <span className="wizard__step-num">{i + 1}</span>
                            <span className="wizard__step-label">{t(`doctorProfile.wizard.steps.${s}`)}</span>
                        </li>
                    ))}
                </ol>

                <ProfileCompletenessMeter compact />

                <div className="wizard__body">
                    {step === 0 && (
                        <div className="proflist__grid">
                            <div className="form-group proflist__half">
                                <label htmlFor="w_title">{t('doctorProfile.settings.professionalTitle')}</label>
                                <input id="w_title" className="input" value={about.professional_title}
                                       placeholder={t('doctorProfile.settings.professionalTitlePlaceholder')}
                                       onChange={e => setAbout(a => ({ ...a, professional_title: e.target.value }))} />
                            </div>
                            <div className="form-group proflist__half">
                                <label htmlFor="w_years">{t('doctorProfile.settings.yearsExperience')}</label>
                                <input id="w_years" type="number" min={0} max={80} className="input"
                                       value={about.years_of_experience}
                                       onChange={e => setAbout(a => ({
                                           ...a, years_of_experience: e.target.value === '' ? '' : Number(e.target.value),
                                       }))} />
                            </div>
                            <div className="form-group">
                                <label htmlFor="w_bio">{t('doctorProfile.settings.bio')}</label>
                                <textarea id="w_bio" className="input" rows={4} maxLength={4000}
                                          placeholder={t('doctorProfile.settings.bioPlaceholder')}
                                          value={about.bio}
                                          onChange={e => setAbout(a => ({ ...a, bio: e.target.value }))} />
                            </div>
                            <div className="form-group">
                                <label htmlFor="w_langs">{t('doctorProfile.settings.languages')}</label>
                                <TagInput id="w_langs" value={about.languages_spoken}
                                          placeholder={t('doctorProfile.settings.languagesPlaceholder')}
                                          onChange={v => setAbout(a => ({ ...a, languages_spoken: v }))} />
                            </div>
                        </div>
                    )}

                    {step === 1 && (
                        <ProfileListEditor<DoctorQualification>
                            title={t('doctorProfile.qualifications')}
                            addLabel={t('doctorProfile.settings.addQualification')}
                            emptyText={t('doctorProfile.wizard.qualificationsHint')}
                            items={qualifications.data ?? []}
                            isLoading={qualifications.isLoading}
                            queryKey={queryKeys.doctorProfile.qualifications()}
                            blank={{ kind: 'degree', title: '', institution: '' }}
                            summary={q => (
                                <>
                                    <div className="proflist__item-title">{q.title}</div>
                                    <div className="proflist__item-meta">
                                        {[q.institution, q.year_awarded].filter(Boolean).join(' · ')}
                                    </div>
                                </>
                            )}
                            fields={[
                                { name: 'kind', label: t('doctorProfile.settings.kind'), type: 'select', half: true,
                                  options: QUALIFICATION_KINDS.map(k => ({ value: k, label: t(`doctorProfile.kinds.${k}`, k) })) },
                                { name: 'title', label: t('doctorProfile.settings.qualificationTitle'), half: true },
                                { name: 'institution', label: t('doctorProfile.settings.institution'), half: true },
                                { name: 'year_awarded', label: t('doctorProfile.settings.year'), type: 'number', half: true },
                            ]}
                            onCreate={doctorProfileService.createQualification}
                            onUpdate={doctorProfileService.updateQualification}
                            onDelete={doctorProfileService.deleteQualification}
                        />
                    )}

                    {step === 2 && (
                        <ProfileListEditor<DoctorExperience>
                            title={t('doctorProfile.experience')}
                            addLabel={t('doctorProfile.settings.addExperience')}
                            emptyText={t('doctorProfile.wizard.experienceHint')}
                            items={experiences.data ?? []}
                            isLoading={experiences.isLoading}
                            queryKey={queryKeys.doctorProfile.experiences()}
                            blank={{ position: '', organization: '', is_current: false }}
                            summary={e => (
                                <>
                                    <div className="proflist__item-title">{e.position}</div>
                                    <div className="proflist__item-meta">{e.organization}</div>
                                </>
                            )}
                            fields={[
                                { name: 'position', label: t('doctorProfile.settings.position'), half: true },
                                { name: 'organization', label: t('doctorProfile.settings.organization'), half: true },
                                { name: 'start_date', label: t('doctorProfile.settings.startDate'), type: 'date', half: true },
                                { name: 'end_date', label: t('doctorProfile.settings.endDate'), type: 'date', half: true },
                                { name: 'is_current', label: t('doctorProfile.settings.isCurrent'), type: 'checkbox' },
                            ]}
                            onCreate={doctorProfileService.createExperience}
                            onUpdate={doctorProfileService.updateExperience}
                            onDelete={doctorProfileService.deleteExperience}
                        />
                    )}

                    {step === 3 && (
                        <>
                            <ProfileListEditor<DoctorService>
                                title={t('doctorProfile.services')}
                                addLabel={t('doctorProfile.settings.addService')}
                                emptyText={t('doctorProfile.wizard.servicesHint')}
                                items={services.data ?? []}
                                isLoading={services.isLoading}
                                queryKey={queryKeys.doctorProfile.services()}
                                blank={{ name: '', is_active: true }}
                                summary={s => <div className="proflist__item-title">{s.name}</div>}
                                fields={[
                                    { name: 'name', label: t('doctorProfile.settings.serviceName'), half: true },
                                    { name: 'fee', label: t('doctorProfile.settings.fee'), type: 'number', half: true },
                                ]}
                                onCreate={doctorProfileService.createService}
                                onUpdate={doctorProfileService.updateService}
                                onDelete={doctorProfileService.deleteService}
                            />
                            <ProfileListEditor<DoctorInsurance>
                                title={t('doctorProfile.insurance')}
                                addLabel={t('doctorProfile.settings.addInsurance')}
                                emptyText={t('doctorProfile.wizard.insuranceHint')}
                                items={insurances.data ?? []}
                                isLoading={insurances.isLoading}
                                queryKey={queryKeys.doctorProfile.insurances()}
                                blank={{ payer_name: '', is_active: true }}
                                summary={i => <div className="proflist__item-title">{i.payer_name}</div>}
                                fields={[
                                    { name: 'payer_name', label: t('doctorProfile.settings.payerName'), half: true },
                                    { name: 'plan_names', label: t('doctorProfile.settings.planNames'), half: true },
                                ]}
                                onCreate={doctorProfileService.createInsurance}
                                onUpdate={doctorProfileService.updateInsurance}
                                onDelete={doctorProfileService.deleteInsurance}
                            />
                        </>
                    )}
                </div>

                <div className="wizard__actions">
                    <button type="button" className="btn btn-secondary"
                            disabled={step === 0}
                            onClick={() => setStep(s => Math.max(0, s - 1))}>
                        ← {t('common.back')}
                    </button>
                    <div className="wizard__actions-right">
                        {!isLast && (
                            <button type="button" className="btn btn-ghost"
                                    onClick={() => setStep(s => s + 1)}>
                                {t('doctorProfile.wizard.skip')}
                            </button>
                        )}
                        {isLast ? (
                            <button type="button" className="btn btn-primary" onClick={finish}>
                                {t('doctorProfile.wizard.finish')}
                            </button>
                        ) : (
                            <button type="button" className="btn btn-primary" disabled={saving} onClick={next}>
                                {saving ? t('common.saving') : t('common.next')}
                            </button>
                        )}
                    </div>
                </div>
                </div>
            </div>
        </>
    );
}
