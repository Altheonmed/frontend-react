import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';

import { toast, parseApiError } from '../../../../shared/components/ui';
import { queryKeys } from '../../../../shared/queryKeys';
import { useDoctorProfile } from '../../hooks/useDoctorProfile';
import TagInput from '../../../doctor-profile/components/TagInput';
import ProfileListEditor from '../../../doctor-profile/components/ProfileListEditor';
import ProfileCompletenessMeter from '../../../doctor-profile/components/ProfileCompletenessMeter';
import { doctorProfileService } from '../../../doctor-profile/services/doctorProfileService';
import type {
    DoctorQualification, DoctorExperience, DoctorService, DoctorInsurance,
} from '../../../doctor-profile/types';
import '../../../doctor-profile/components/ProfileEditor.css';

const QUALIFICATION_KINDS = [
    'degree', 'board_certification', 'fellowship', 'residency',
    'training', 'membership', 'award',
] as const;

export default function ProfessionalSection() {
    const { t } = useTranslation();
    const { profile, saveProfile } = useDoctorProfile();
    const qc = useQueryClient();

    const [form, setForm] = useState({
        professional_title: '', bio: '', years_of_experience: '' as string | number,
        languages_spoken: [] as string[], subspecialties: [] as string[],
        public_phone: '', public_email: '',
        telemedicine_available: false, accepting_new_patients: true,
    });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!profile) return;
        const p = profile as unknown as Record<string, unknown>;
        setForm({
            professional_title: (p.professional_title as string) ?? '',
            bio: (p.bio as string) ?? '',
            years_of_experience: (p.years_of_experience as number) ?? '',
            languages_spoken: (p.languages_spoken as string[]) ?? [],
            subspecialties: (p.subspecialties as string[]) ?? [],
            public_phone: (p.public_phone as string) ?? '',
            public_email: (p.public_email as string) ?? '',
            telemedicine_available: Boolean(p.telemedicine_available),
            accepting_new_patients: p.accepting_new_patients !== false,
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

    async function onSave() {
        setSaving(true);
        try {
            await saveProfile({
                ...form,
                years_of_experience: form.years_of_experience === '' ? null : Number(form.years_of_experience),
            });
            qc.invalidateQueries({ queryKey: queryKeys.doctorProfile.completeness() });
            toast.success(t('doctorProfile.saved'));
        } catch (err) {
            toast.error(parseApiError(err, t('doctorProfile.saveError')));
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="settings-card profedit">
            <div className="settings-card-head">
                <h2 className="settings-card-title">{t('doctorProfile.settings.title')}</h2>
                <p className="settings-card-subtitle">{t('doctorProfile.settings.subtitle')}</p>
            </div>

            <ProfileCompletenessMeter />

            {profile?.id && (
                <p className="profedit__preview">
                    <Link to={`/find-doctors/${profile.id}`} target="_blank" rel="noreferrer">
                        {t('doctorProfile.settings.previewPublic')} →
                    </Link>
                </p>
            )}

            {/* ── About ── */}
            <div className="profedit__block">
                <h3 className="proflist__title">{t('doctorProfile.about')}</h3>
                <div className="proflist__grid">
                    <div className="form-group proflist__half">
                        <label htmlFor="professional_title">{t('doctorProfile.settings.professionalTitle')}</label>
                        <input id="professional_title" className="input"
                               placeholder={t('doctorProfile.settings.professionalTitlePlaceholder')}
                               value={form.professional_title}
                               onChange={e => setForm(f => ({ ...f, professional_title: e.target.value }))} />
                    </div>
                    <div className="form-group proflist__half">
                        <label htmlFor="years_of_experience">{t('doctorProfile.settings.yearsExperience')}</label>
                        <input id="years_of_experience" type="number" min={0} max={80} className="input"
                               value={form.years_of_experience}
                               onChange={e => setForm(f => ({
                                   ...f, years_of_experience: e.target.value === '' ? '' : Number(e.target.value),
                               }))} />
                    </div>
                    <div className="form-group">
                        <label htmlFor="bio">{t('doctorProfile.settings.bio')}</label>
                        <textarea id="bio" className="input" rows={4} maxLength={4000}
                                  placeholder={t('doctorProfile.settings.bioPlaceholder')}
                                  value={form.bio}
                                  onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} />
                        <small className="form-hint">{form.bio.length} / 4000</small>
                    </div>
                    <div className="form-group">
                        <label htmlFor="languages_spoken">{t('doctorProfile.settings.languages')}</label>
                        <TagInput id="languages_spoken" value={form.languages_spoken}
                                  placeholder={t('doctorProfile.settings.languagesPlaceholder')}
                                  onChange={v => setForm(f => ({ ...f, languages_spoken: v }))} />
                        <small className="form-hint">{t('doctorProfile.settings.languagesHint')}</small>
                    </div>
                    <div className="form-group">
                        <label htmlFor="subspecialties">{t('doctorProfile.settings.subspecialties')}</label>
                        <TagInput id="subspecialties" value={form.subspecialties}
                                  placeholder={t('doctorProfile.settings.subspecialtiesPlaceholder')}
                                  onChange={v => setForm(f => ({ ...f, subspecialties: v }))} />
                    </div>
                </div>
            </div>

            {/* ── Public contact ── */}
            <div className="profedit__block">
                <h3 className="proflist__title">{t('doctorProfile.settings.publicContact')}</h3>
                <p className="profedit__note">{t('doctorProfile.settings.publicContactNote')}</p>
                <div className="proflist__grid">
                    <div className="form-group proflist__half">
                        <label htmlFor="public_phone">{t('doctorProfile.phone')}</label>
                        <input id="public_phone" className="input" value={form.public_phone}
                               onChange={e => setForm(f => ({ ...f, public_phone: e.target.value }))} />
                    </div>
                    <div className="form-group proflist__half">
                        <label htmlFor="public_email">{t('doctorProfile.email')}</label>
                        <input id="public_email" type="email" className="input" value={form.public_email}
                               onChange={e => setForm(f => ({ ...f, public_email: e.target.value }))} />
                    </div>
                    <div className="form-group">
                        <label className="proflist__check" htmlFor="telemedicine_available">
                            <input id="telemedicine_available" type="checkbox"
                                   checked={form.telemedicine_available}
                                   onChange={e => setForm(f => ({ ...f, telemedicine_available: e.target.checked }))} />
                            {t('doctorProfile.settings.telemedicine')}
                        </label>
                        <label className="proflist__check" htmlFor="accepting_new_patients">
                            <input id="accepting_new_patients" type="checkbox"
                                   checked={form.accepting_new_patients}
                                   onChange={e => setForm(f => ({ ...f, accepting_new_patients: e.target.checked }))} />
                            {t('doctorProfile.settings.acceptingNewPatients')}
                        </label>
                    </div>
                </div>
                <div className="proflist__form-actions">
                    <button type="button" className="btn btn-primary" onClick={onSave} disabled={saving}>
                        {saving ? t('common.saving') : t('common.save')}
                    </button>
                </div>
            </div>

            {/* ── Qualifications ── */}
            <ProfileListEditor<DoctorQualification>
                title={t('doctorProfile.qualifications')}
                addLabel={t('doctorProfile.settings.addQualification')}
                emptyText={t('doctorProfile.settings.noQualifications')}
                items={qualifications.data ?? []}
                isLoading={qualifications.isLoading}
                queryKey={queryKeys.doctorProfile.qualifications()}
                blank={{ kind: 'degree', title: '', institution: '', field: '', country: '' }}
                summary={q => (
                    <>
                        <div className="proflist__item-title">{q.title}</div>
                        <div className="proflist__item-meta">
                            {[q.kind_display ?? t(`doctorProfile.kinds.${q.kind}`, q.kind),
                              q.institution, q.year_awarded].filter(Boolean).join(' · ')}
                            {!q.is_verified && (
                                <span className="proflist__flag">{t('doctorProfile.selfReported')}</span>
                            )}
                        </div>
                    </>
                )}
                fields={[
                    { name: 'kind', label: t('doctorProfile.settings.kind'), type: 'select', half: true,
                      options: QUALIFICATION_KINDS.map(k => ({ value: k, label: t(`doctorProfile.kinds.${k}`, k) })) },
                    { name: 'title', label: t('doctorProfile.settings.qualificationTitle'), half: true,
                      placeholder: 'MBBS' },
                    { name: 'institution', label: t('doctorProfile.settings.institution'), half: true },
                    { name: 'field', label: t('doctorProfile.settings.field'), half: true },
                    { name: 'year_awarded', label: t('doctorProfile.settings.year'), type: 'number', half: true },
                    { name: 'country', label: t('doctorProfile.settings.country'), half: true },
                ]}
                onCreate={doctorProfileService.createQualification}
                onUpdate={doctorProfileService.updateQualification}
                onDelete={doctorProfileService.deleteQualification}
            />

            {/* ── Experience ── */}
            <ProfileListEditor<DoctorExperience>
                title={t('doctorProfile.experience')}
                addLabel={t('doctorProfile.settings.addExperience')}
                emptyText={t('doctorProfile.settings.noExperience')}
                items={experiences.data ?? []}
                isLoading={experiences.isLoading}
                queryKey={queryKeys.doctorProfile.experiences()}
                blank={{ position: '', organization: '', city: '', country: '', is_current: false }}
                summary={e => (
                    <>
                        <div className="proflist__item-title">{e.position}</div>
                        <div className="proflist__item-meta">
                            {[e.organization, e.city].filter(Boolean).join(' · ')}
                            {e.is_current && <span className="proflist__flag">{t('doctorProfile.current')}</span>}
                        </div>
                    </>
                )}
                fields={[
                    { name: 'position', label: t('doctorProfile.settings.position'), half: true },
                    { name: 'organization', label: t('doctorProfile.settings.organization'), half: true },
                    { name: 'city', label: t('doctorProfile.settings.city'), half: true },
                    { name: 'country', label: t('doctorProfile.settings.country'), half: true },
                    { name: 'start_date', label: t('doctorProfile.settings.startDate'), type: 'date', half: true },
                    { name: 'end_date', label: t('doctorProfile.settings.endDate'), type: 'date', half: true },
                    { name: 'is_current', label: t('doctorProfile.settings.isCurrent'), type: 'checkbox' },
                    { name: 'description', label: t('doctorProfile.settings.description'), type: 'textarea' },
                ]}
                onCreate={doctorProfileService.createExperience}
                onUpdate={doctorProfileService.updateExperience}
                onDelete={doctorProfileService.deleteExperience}
            />

            {/* ── Services ── */}
            <ProfileListEditor<DoctorService>
                title={t('doctorProfile.services')}
                addLabel={t('doctorProfile.settings.addService')}
                emptyText={t('doctorProfile.settings.noServices')}
                items={services.data ?? []}
                isLoading={services.isLoading}
                queryKey={queryKeys.doctorProfile.services()}
                blank={{ name: '', description: '', is_active: true }}
                summary={s => (
                    <>
                        <div className="proflist__item-title">{s.name}</div>
                        <div className="proflist__item-meta">
                            {s.fee ? `${s.fee} ${s.currency || ''}` : t('doctorProfile.feeOnRequest')}
                            {s.duration_minutes ? ` · ${s.duration_minutes} min` : ''}
                        </div>
                    </>
                )}
                fields={[
                    { name: 'name', label: t('doctorProfile.settings.serviceName'), half: true },
                    { name: 'duration_minutes', label: t('doctorProfile.settings.duration'), type: 'number', half: true },
                    { name: 'fee', label: t('doctorProfile.settings.fee'), type: 'number', half: true },
                    { name: 'currency', label: t('doctorProfile.settings.currency'), half: true,
                      placeholder: t('doctorProfile.settings.currencyPlaceholder') },
                    { name: 'description', label: t('doctorProfile.settings.description'), type: 'textarea' },
                ]}
                onCreate={doctorProfileService.createService}
                onUpdate={doctorProfileService.updateService}
                onDelete={doctorProfileService.deleteService}
            />

            {/* ── Insurance ── */}
            <ProfileListEditor<DoctorInsurance>
                title={t('doctorProfile.insurance')}
                addLabel={t('doctorProfile.settings.addInsurance')}
                emptyText={t('doctorProfile.settings.noInsurance')}
                items={insurances.data ?? []}
                isLoading={insurances.isLoading}
                queryKey={queryKeys.doctorProfile.insurances()}
                blank={{ payer_name: '', plan_names: '', notes: '', is_active: true }}
                summary={i => (
                    <>
                        <div className="proflist__item-title">{i.payer_name}</div>
                        {i.plan_names && <div className="proflist__item-meta">{i.plan_names}</div>}
                    </>
                )}
                fields={[
                    { name: 'payer_name', label: t('doctorProfile.settings.payerName'), half: true },
                    { name: 'plan_names', label: t('doctorProfile.settings.planNames'), half: true,
                      placeholder: t('doctorProfile.settings.planNamesPlaceholder') },
                    { name: 'notes', label: t('doctorProfile.settings.notes') },
                ]}
                onCreate={doctorProfileService.createInsurance}
                onUpdate={doctorProfileService.updateInsurance}
                onDelete={doctorProfileService.deleteInsurance}
            />
        </div>
    );
}
