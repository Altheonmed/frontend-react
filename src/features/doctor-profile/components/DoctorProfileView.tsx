import { useMemo, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import LeafletMap, { type MapMarker } from '../../../shared/components/map/LeafletMap';
import Avatar from '../../../shared/components/Avatar';
import { openDirections } from '../../../shared/utils/directions';
import type { DoctorProfileData } from '../types';
import './DoctorProfileView.css';

/**
 * The one doctor profile rendering used by all three surfaces:
 * public discovery, the patient portal, and the doctor-to-doctor view.
 *
 * Purely presentational — the caller fetches, normalises and passes the data,
 * and supplies its own call-to-action. `variant` decides two things: whether
 * the colleague-only block renders, and how hard the page works to hide gaps.
 * A patient choosing a doctor should not be shown five "nothing here yet"
 * cards, so public-facing variants drop empty sections entirely; the colleague
 * view keeps them, because a referrer benefits from seeing what is missing.
 */
export interface DoctorProfileViewProps {
    doctor: DoctorProfileData;
    variant?: 'public' | 'patient' | 'colleague';
    /** Primary call-to-action. Sticky beside the profile on desktop, pinned to a bottom bar on mobile. */
    actions?: ReactNode;
    /** Supporting line under the CTA. Hidden in the mobile bar to keep it thumb-sized. */
    actionsNote?: ReactNode;
    showMap?: boolean;
    compact?: boolean;
}

// Spoken languages are stored as short codes; patients should not have to
// decode "WO". Falls back to the raw value for anything unlisted.
const LANGUAGE_NAMES: Record<string, string> = {
    en: 'English', fr: 'Français', ar: 'العربية', wo: 'Wolof', ur: 'اردو',
    es: 'Español', pt: 'Português', de: 'Deutsch', it: 'Italiano',
    tr: 'Türkçe', hi: 'हिन्दी', bn: 'বাংলা', sw: 'Kiswahili', zh: '中文',
};
const languageLabel = (code: string) =>
    LANGUAGE_NAMES[code?.toLowerCase()] ?? code?.toUpperCase();

function Section({ title, children, count }: { title: string; children: ReactNode; count?: number }) {
    return (
        <section className="docprof__card">
            <h2 className="docprof__card-title">
                {title}
                {count !== undefined && count > 0 && <span className="docprof__count">{count}</span>}
            </h2>
            {children}
        </section>
    );
}

function Empty({ text }: { text: string }) {
    return <p className="docprof__empty">{text}</p>;
}

function InfoRow({ label, value }: { label: string; value?: ReactNode }) {
    if (value === null || value === undefined || value === '') return null;
    return (
        <div className="docprof__row">
            <div className="docprof__row-label">{label}</div>
            <div className="docprof__row-value">{value}</div>
        </div>
    );
}

function formatMonthYear(value?: string | null) {
    if (!value) return '';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short' });
}

export default function DoctorProfileView({
    doctor, variant = 'public', actions, actionsNote, showMap = true, compact = false,
}: DoctorProfileViewProps) {
    const { t } = useTranslation();
    const isColleague = variant === 'colleague';
    // Public-facing views hide gaps; the colleague view shows them.
    const hideEmpty = !isColleague;

    const markers: MapMarker[] = useMemo(() => (doctor.locations ?? [])
        .filter(l => l.latitude != null && l.longitude != null)
        .map(l => ({
            id: l.id,
            lat: l.latitude as number,
            lng: l.longitude as number,
            primary: l.is_primary,
            popup: <div className="map-popup__name">{l.label || l.full_address}</div>,
        })), [doctor.locations]);

    const center: [number, number] | null = markers.length ? [markers[0].lat, markers[0].lng] : null;
    const feeLabel = doctor.consultation_fee
        ? `${doctor.consultation_fee} ${doctor.currency ?? ''}`.trim()
        : null;

    const has = {
        bio: Boolean(doctor.bio?.trim()),
        qualifications: doctor.qualifications.length > 0,
        experiences: doctor.experiences.length > 0,
        services: doctor.services.length > 0,
        insurances: doctor.insurances.length > 0,
        locations: doctor.locations.length > 0,
        contact: Boolean(doctor.clinic_name || doctor.public_phone || doctor.public_email),
    };
    // Nothing beyond name and specialty — say so once, plainly, instead of
    // repeating an empty card for every section.
    const isSparse = !has.bio && !has.qualifications && !has.experiences
        && !has.services && !has.insurances;

    const show = (key: keyof typeof has) => has[key] || !hideEmpty;

    return (
        <div className={`docprof${compact ? ' docprof--compact' : ''}`}>
            {/* ── Hero ── */}
            <section className="docprof__hero">
                <Avatar name={doctor.full_name.replace(/^Dr\.?\s*/i, '')} src={doctor.avatar_url} size="xl" />
                <div className="docprof__hero-body">
                    <h1 className="docprof__name">{doctor.full_name}</h1>
                    {doctor.professional_title && (
                        <p className="docprof__title">{doctor.professional_title}</p>
                    )}
                    <p className="docprof__specialty">
                        {doctor.specialty
                            ? t(`specialties.${doctor.specialty}`, doctor.specialty_display || doctor.specialty)
                            : doctor.specialty_display}
                    </p>

                    <div className="docprof__badges">
                        {doctor.years_of_experience != null && (
                            <span className="docprof__pill docprof__pill--accent">
                                {t('doctorProfile.yearsExperience', { count: doctor.years_of_experience })}
                            </span>
                        )}
                        {doctor.languages.length > 0 && (
                            <span className="docprof__pill">
                                {t('doctorProfile.speaks')} {doctor.languages.map(languageLabel).join(', ')}
                            </span>
                        )}
                        {doctor.telemedicine_available && (
                            <span className="docprof__pill docprof__pill--ok">
                                {t('doctorProfile.telemedicine')}
                            </span>
                        )}
                        {doctor.accepting_new_patients === false && (
                            <span className="docprof__pill docprof__pill--muted">
                                {t('doctorProfile.notAcceptingPatients')}
                            </span>
                        )}
                    </div>

                    {doctor.subspecialties.length > 0 && (
                        <div className="docprof__tags">
                            {doctor.subspecialties.map(s => (
                                <span key={s} className="docprof__tag">{s}</span>
                            ))}
                        </div>
                    )}
                </div>
            </section>

            <div className="docprof__grid">
                <div className="docprof__col">
                    {/* ── About ── */}
                    {(has.bio || !hideEmpty) && (
                        <Section title={t('doctorProfile.about')}>
                            {has.bio
                                ? <p className="docprof__bio">{doctor.bio}</p>
                                : <Empty text={t('doctorProfile.noBio')} />}
                        </Section>
                    )}

                    {isSparse && hideEmpty && (
                        <section className="docprof__card docprof__note">
                            <p>{t('doctorProfile.sparseProfile', { name: doctor.full_name })}</p>
                        </section>
                    )}

                    {/* ── Qualifications ── */}
                    {show('qualifications') && (
                        <Section title={t('doctorProfile.qualifications')} count={doctor.qualifications.length}>
                            {!has.qualifications && <Empty text={t('doctorProfile.noQualifications')} />}
                            {doctor.qualifications.map(q => (
                                <div key={q.id} className="docprof__item">
                                    <div className="docprof__item-head">
                                        <span className="docprof__item-title">{q.title}</span>
                                        {q.is_verified
                                            ? <span className="docprof__badge docprof__badge--ok">✓ {t('doctorProfile.verified')}</span>
                                            : <span className="docprof__badge">{t('doctorProfile.selfReported')}</span>}
                                    </div>
                                    <div className="docprof__item-meta">
                                        {[q.kind_display, q.institution, q.field, q.year_awarded, q.country]
                                            .filter(Boolean).join(' · ')}
                                    </div>
                                </div>
                            ))}
                        </Section>
                    )}

                    {/* ── Experience ── */}
                    {show('experiences') && (
                        <Section title={t('doctorProfile.experience')} count={doctor.experiences.length}>
                            {!has.experiences && <Empty text={t('doctorProfile.noExperience')} />}
                            {doctor.experiences.map(e => (
                                <div key={e.id} className="docprof__item">
                                    <div className="docprof__item-head">
                                        <span className="docprof__item-title">{e.position}</span>
                                        {e.is_current && (
                                            <span className="docprof__badge docprof__badge--ok">{t('doctorProfile.current')}</span>
                                        )}
                                    </div>
                                    <div className="docprof__item-meta">
                                        {[e.organization, [e.city, e.country].filter(Boolean).join(', ')]
                                            .filter(Boolean).join(' · ')}
                                    </div>
                                    {(e.start_date || e.end_date) && (
                                        <div className="docprof__item-dates">
                                            {formatMonthYear(e.start_date)}
                                            {' – '}
                                            {e.is_current ? t('doctorProfile.present') : formatMonthYear(e.end_date)}
                                        </div>
                                    )}
                                    {e.description && <p className="docprof__item-desc">{e.description}</p>}
                                </div>
                            ))}
                        </Section>
                    )}

                    {/* ── Services ── */}
                    {show('services') && (
                        <Section title={t('doctorProfile.services')} count={doctor.services.length}>
                            {!has.services && <Empty text={t('doctorProfile.noServices')} />}
                            {has.services && (
                                <ul className="docprof__services">
                                    {doctor.services.map(s => (
                                        <li key={s.id} className="docprof__service">
                                            <div className="docprof__service-main">
                                                <span className="docprof__item-title">{s.name}</span>
                                                {s.description && <p className="docprof__item-desc">{s.description}</p>}
                                            </div>
                                            <div className="docprof__service-side">
                                                {s.fee
                                                    ? <span className="docprof__fee">{s.fee} {s.currency || doctor.currency || ''}</span>
                                                    : <span className="docprof__fee docprof__fee--ask">{t('doctorProfile.feeOnRequest')}</span>}
                                                {s.duration_minutes && (
                                                    <span className="docprof__duration">{t('doctorProfile.minutes', { count: s.duration_minutes })}</span>
                                                )}
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </Section>
                    )}

                    {/* ── Insurance ── */}
                    {show('insurances') && (
                        <Section title={t('doctorProfile.insurance')} count={doctor.insurances.length}>
                            {!has.insurances && <Empty text={t('doctorProfile.noInsurance')} />}
                            {has.insurances && (
                                <>
                                    <div className="docprof__chips">
                                        {doctor.insurances.map(i => (
                                            <span key={i.id} className="docprof__chip" title={i.plan_names || undefined}>
                                                {i.payer_name}
                                                {i.plan_names && <em className="docprof__chip-plans">{i.plan_names}</em>}
                                            </span>
                                        ))}
                                    </div>
                                    <p className="docprof__disclaimer">{t('doctorProfile.insuranceDisclaimer')}</p>
                                </>
                            )}
                        </Section>
                    )}
                </div>

                <div className="docprof__col">
                    {/* ── Booking / primary action ── */}
                    {actions && (
                        <aside className="docprof__cta" aria-label={t('findDoctors.booking.title')}>
                            <div className="docprof__cta-inner">
                                {feeLabel && (
                                    <div className="docprof__cta-fee">
                                        <span className="docprof__cta-fee-amount">{feeLabel}</span>
                                        <span className="docprof__cta-fee-label">{t('doctorProfile.consultationFee')}</span>
                                    </div>
                                )}
                                <div className="docprof__cta-actions">{actions}</div>
                                {actionsNote && <p className="docprof__cta-note">{actionsNote}</p>}
                            </div>
                        </aside>
                    )}

                    {/* ── Contact ── */}
                    {show('contact') && (
                        <Section title={t('doctorProfile.contact')}>
                            <InfoRow label={t('doctorProfile.practice')} value={doctor.clinic_name} />
                            <InfoRow
                                label={t('doctorProfile.phone')}
                                value={doctor.public_phone
                                    ? <a href={`tel:${doctor.public_phone.replace(/\s+/g, '')}`}>{doctor.public_phone}</a>
                                    : null}
                            />
                            <InfoRow
                                label={t('doctorProfile.email')}
                                value={doctor.public_email
                                    ? <a href={`mailto:${doctor.public_email}`}>{doctor.public_email}</a>
                                    : null}
                            />
                            <InfoRow
                                label={t('doctorProfile.website')}
                                value={doctor.clinic_website
                                    ? <a href={doctor.clinic_website} target="_blank" rel="noreferrer noopener">{doctor.clinic_website}</a>
                                    : null}
                            />
                            {!has.contact && <Empty text={t('doctorProfile.noContact')} />}
                        </Section>
                    )}

                    {/* ── Colleague-only ── */}
                    {isColleague && (
                        <Section title={t('doctorProfile.professionalDetails')}>
                            <InfoRow label={t('doctorProfile.licenseNumber')} value={doctor.license_number} />
                            <InfoRow label={t('doctorProfile.registrationAuthority')} value={doctor.registration_authority} />
                            <InfoRow label={t('doctorProfile.directLine')} value={doctor.phone_number} />
                            <InfoRow label={t('doctorProfile.timezone')} value={doctor.timezone} />
                            <InfoRow
                                label={t('doctorProfile.acceptingReferrals')}
                                value={doctor.accepting_referrals ? t('common.yes') : t('common.no')}
                            />
                            {doctor.out_of_office_until && (
                                <InfoRow label={t('doctorProfile.outOfOffice')} value={doctor.out_of_office_until} />
                            )}
                            {doctor.coverage_doctor_name && (
                                <InfoRow label={t('doctorProfile.coveredBy')} value={doctor.coverage_doctor_name} />
                            )}
                        </Section>
                    )}

                    {/* ── Locations ── */}
                    {show('locations') && (
                        <Section title={t('doctorProfile.locations')} count={doctor.locations.length}>
                            {!has.locations && <Empty text={t('doctorProfile.noLocations')} />}
                            {doctor.locations.map(l => {
                                const canRoute = (l.latitude != null && l.longitude != null) || !!l.full_address;
                                return (
                                    <div key={l.id} className="docprof__loc">
                                        <p className="docprof__loc-name">
                                            {l.label || l.city}
                                            {l.is_primary && <span className="docprof__star">★ {t('doctorProfile.primary')}</span>}
                                        </p>
                                        <div className="docprof__loc-addr">{l.full_address}</div>
                                        {l.phone && (
                                            <div className="docprof__loc-phone">
                                                <a href={`tel:${l.phone.replace(/\s+/g, '')}`}>{l.phone}</a>
                                            </div>
                                        )}
                                        {canRoute && (
                                            <button
                                                type="button"
                                                className="btn btn-secondary btn-xs"
                                                onClick={() => openDirections({
                                                    lat: l.latitude, lng: l.longitude,
                                                    address: l.full_address,
                                                    label: l.label || doctor.full_name,
                                                })}
                                            >
                                                {t('findDoctors.getDirections')}
                                            </button>
                                        )}
                                    </div>
                                );
                            })}
                        </Section>
                    )}

                    {showMap && center && (
                        <div className="docprof__map">
                            <LeafletMap center={center} zoom={13} markers={markers} height="280px"
                                        ariaLabel={t('findDoctors.mapLabel')} />
                        </div>
                    )}
                </div>
            </div>

            {/* Mobile: the primary action is pinned within thumb reach rather
                than scrolled off the top of the page. */}
            {actions && (
                <div className="docprof__mobile-cta">
                    {feeLabel && <span className="docprof__mobile-cta-fee">{feeLabel}</span>}
                    <div className="docprof__mobile-cta-action">{actions}</div>
                </div>
            )}
        </div>
    );
}
