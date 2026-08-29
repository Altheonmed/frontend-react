// Doctor professional profile — shared types across the three surfaces that
// render a doctor: public discovery, patient portal, and doctor-to-doctor.

import type { PracticeLocation } from '../locator/types';

export type QualificationKind =
    | 'degree' | 'board_certification' | 'fellowship' | 'residency'
    | 'training' | 'membership' | 'award';

export interface DoctorQualification {
    id: number;
    kind: QualificationKind;
    kind_display?: string;
    title: string;
    institution?: string;
    field?: string;
    year_awarded?: number | null;
    country?: string;
    credential_id?: string;
    expires_on?: string | null;
    /** Admin-set. False renders the "self-reported" label. */
    is_verified?: boolean;
    display_order?: number;
}

export interface DoctorExperience {
    id: number;
    position: string;
    organization: string;
    city?: string;
    country?: string;
    start_date?: string | null;
    end_date?: string | null;
    is_current?: boolean;
    description?: string;
    display_order?: number;
}

export interface DoctorService {
    id: number;
    name: string;
    description?: string;
    fee?: string | number | null;
    currency?: string;
    duration_minutes?: number | null;
    is_active?: boolean;
    display_order?: number;
}

export interface DoctorInsurance {
    id: number;
    payer_name: string;
    plan_names?: string;
    notes?: string;
    is_active?: boolean;
    display_order?: number;
}

/**
 * One normalised shape for the shared profile view.
 *
 * The three endpoints differ slightly — the public profile returns
 * `languages`, the colleague endpoint returns `languages_spoken`, and the
 * patient endpoint returns `clinic` rather than `clinic_name` — so callers run
 * their payload through `normalizeDoctorProfile` instead of the view having to
 * know which endpoint it came from.
 */
export interface DoctorProfileData {
    id: number;
    full_name: string;
    professional_title?: string;
    specialty?: string;
    specialty_display?: string;
    subspecialties: string[];
    bio?: string;
    years_of_experience?: number | null;
    languages: string[];
    avatar_url?: string | null;

    clinic_name?: string | null;
    clinic_website?: string;
    public_phone?: string;
    public_email?: string;

    consultation_fee?: string | number | null;
    currency?: string | null;
    timezone?: string | null;
    next_available?: string | null;
    accepting_referrals?: boolean;
    accepting_new_patients?: boolean;
    telemedicine_available?: boolean;

    locations: PracticeLocation[];
    qualifications: DoctorQualification[];
    experiences: DoctorExperience[];
    services: DoctorService[];
    insurances: DoctorInsurance[];

    // Colleague-only — present when a doctor views another doctor.
    license_number?: string;
    registration_authority?: string;
    phone_number?: string;
    out_of_office_until?: string | null;
    coverage_doctor_name?: string | null;
}

type RawProfile = Record<string, unknown>;

function asArray<T>(value: unknown): T[] {
    return Array.isArray(value) ? (value as T[]) : [];
}

/** Fold any of the three payload shapes into `DoctorProfileData`. */
export function normalizeDoctorProfile(raw: RawProfile): DoctorProfileData {
    const languages = Array.isArray(raw.languages)
        ? (raw.languages as string[])
        : asArray<string>(raw.languages_spoken);

    return {
        id: Number(raw.id),
        full_name: String(raw.full_name ?? ''),
        professional_title: (raw.professional_title as string) || '',
        specialty: raw.specialty as string | undefined,
        // The patient endpoint historically returns the *display* label in
        // `specialty`, so prefer the explicit display field when present.
        specialty_display: (raw.specialty_display as string) || (raw.specialty as string) || '',
        subspecialties: asArray<string>(raw.subspecialties),
        bio: (raw.bio as string) || '',
        years_of_experience: (raw.years_of_experience as number | null) ?? null,
        languages,
        avatar_url: (raw.avatar_url as string | null) ?? null,

        clinic_name: (raw.clinic_name as string | null) ?? (raw.clinic as string | null) ?? null,
        clinic_website: (raw.clinic_website as string) || '',
        public_phone: (raw.public_phone as string) || (raw.phone_number as string) || '',
        public_email: (raw.public_email as string) || (raw.email as string) || '',

        consultation_fee: (raw.consultation_fee as string | null) ?? null,
        currency: (raw.currency as string | null) ?? null,
        timezone: (raw.timezone as string | null) ?? null,
        next_available: (raw.next_available as string | null) ?? null,
        accepting_referrals: raw.accepting_referrals as boolean | undefined,
        accepting_new_patients: raw.accepting_new_patients as boolean | undefined,
        telemedicine_available: raw.telemedicine_available as boolean | undefined,

        locations: asArray<PracticeLocation>(raw.locations),
        qualifications: asArray<DoctorQualification>(raw.qualifications),
        experiences: asArray<DoctorExperience>(raw.experiences),
        services: asArray<DoctorService>(raw.services),
        insurances: asArray<DoctorInsurance>(raw.insurances),

        license_number: raw.license_number as string | undefined,
        registration_authority: raw.registration_authority as string | undefined,
        phone_number: raw.phone_number as string | undefined,
        out_of_office_until: (raw.out_of_office_until as string | null) ?? null,
        coverage_doctor_name: (raw.coverage_doctor_name as string | null) ?? null,
    };
}

// ── Doctor-side editing ────────────────────────────────────────────────────

export interface ProfileCompleteness {
    completeness: number;
    parts: Record<string, boolean>;
    missing: string[];
    can_publish: boolean;
    profile_published: boolean;
    is_profile_public: boolean;
    profile_completed_at: string | null;
    prompt_dismissed_until: string | null;
}

export interface ColleagueSummary {
    id: number;
    full_name: string;
    specialty: string;
    specialty_display: string;
    accepting_referrals: boolean;
    avatar_url?: string | null;
}
