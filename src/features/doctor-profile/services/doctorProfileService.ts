// Doctor professional profile — API access for all three read surfaces plus
// the doctor's own list editing.

import api from '../../../shared/services/api';
import {
    normalizeDoctorProfile,
    type DoctorProfileData,
    type DoctorQualification,
    type DoctorExperience,
    type DoctorService,
    type DoctorInsurance,
    type ProfileCompleteness,
    type ColleagueSummary,
} from '../types';

export const doctorProfileService = {
    // ── Reads ───────────────────────────────────────────────────────────────
    /** Public discovery profile (no auth). */
    getPublicProfile: (id: number): Promise<DoctorProfileData> =>
        api.get(`/patient/doctors/${id}/public-profile/`).then(r => normalizeDoctorProfile(r.data)),

    /** Patient-facing profile — only for a doctor on the patient's care team. */
    getPatientDoctorProfile: (id: number): Promise<DoctorProfileData> =>
        api.get(`/patient/doctor/${id}/`).then(r => normalizeDoctorProfile(r.data)),

    /** Doctor-to-doctor profile — includes licence + direct contact. */
    getColleagueProfile: (id: number): Promise<DoctorProfileData> =>
        api.get(`/doctors/${id}/`).then(r => normalizeDoctorProfile(r.data)),

    /** Colleague directory used by the referral picker. */
    listColleagues: (params: { specialty?: string; accepting_referrals?: boolean } = {}) => {
        const query: Record<string, string> = {};
        if (params.specialty) query.specialty = params.specialty;
        if (params.accepting_referrals) query.accepting_referrals = 'true';
        return api.get('/doctors/', { params: query }).then(r => {
            const data = r.data;
            return (Array.isArray(data) ? data : data.results ?? []) as ColleagueSummary[];
        });
    },

    // ── Own profile completeness ────────────────────────────────────────────
    getCompleteness: (): Promise<ProfileCompleteness> =>
        api.get('/profile/completeness/').then(r => r.data),

    markProfileCompleted: (): Promise<ProfileCompleteness> =>
        api.post('/profile/completeness/', { completed: true }).then(r => r.data),

    snoozePrompt: (days: number): Promise<ProfileCompleteness> =>
        api.post('/profile/completeness/', { snooze_days: days }).then(r => r.data),

    // ── Own list CRUD ───────────────────────────────────────────────────────
    listQualifications: (): Promise<DoctorQualification[]> =>
        api.get('/profile/qualifications/').then(r => r.data),
    createQualification: (d: Partial<DoctorQualification>) =>
        api.post('/profile/qualifications/', d).then(r => r.data),
    updateQualification: (id: number, d: Partial<DoctorQualification>) =>
        api.patch(`/profile/qualifications/${id}/`, d).then(r => r.data),
    deleteQualification: (id: number) =>
        api.delete(`/profile/qualifications/${id}/`).then(r => r.data),

    listExperiences: (): Promise<DoctorExperience[]> =>
        api.get('/profile/experience/').then(r => r.data),
    createExperience: (d: Partial<DoctorExperience>) =>
        api.post('/profile/experience/', d).then(r => r.data),
    updateExperience: (id: number, d: Partial<DoctorExperience>) =>
        api.patch(`/profile/experience/${id}/`, d).then(r => r.data),
    deleteExperience: (id: number) =>
        api.delete(`/profile/experience/${id}/`).then(r => r.data),

    listServices: (): Promise<DoctorService[]> =>
        api.get('/profile/services/').then(r => r.data),
    createService: (d: Partial<DoctorService>) =>
        api.post('/profile/services/', d).then(r => r.data),
    updateService: (id: number, d: Partial<DoctorService>) =>
        api.patch(`/profile/services/${id}/`, d).then(r => r.data),
    deleteService: (id: number) =>
        api.delete(`/profile/services/${id}/`).then(r => r.data),

    listInsurances: (): Promise<DoctorInsurance[]> =>
        api.get('/profile/insurance/').then(r => r.data),
    createInsurance: (d: Partial<DoctorInsurance>) =>
        api.post('/profile/insurance/', d).then(r => r.data),
    updateInsurance: (id: number, d: Partial<DoctorInsurance>) =>
        api.patch(`/profile/insurance/${id}/`, d).then(r => r.data),
    deleteInsurance: (id: number) =>
        api.delete(`/profile/insurance/${id}/`).then(r => r.data),
};
