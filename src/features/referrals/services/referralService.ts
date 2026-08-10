import api from '../../../shared/services/api';

export const getReferrals = (params?: Record<string, string | number>) =>
    api.get('/referrals/', { params });

export const getReferral = (id: number) =>
    api.get(`/referrals/${id}/`);

export const createReferral = (data: FormData) =>
    api.post('/referrals/', data);

export const updateReferral = (id: number, data: FormData) =>
    api.patch(`/referrals/${id}/`, data);

export const deleteReferral = (id: number) =>
    api.delete(`/referrals/${id}/`);

export const submitDraft = (id: number) =>
    api.post(`/referrals/${id}/submit/`);

// Build multipart form data when the doctor attached response files; the
// backend reads them under the repeated `response_documents` key.
const withResponseFiles = (
    fields: Record<string, string | undefined>,
    files?: File[],
): FormData => {
    const fd = new FormData();
    Object.entries(fields).forEach(([k, v]) => {
        if (v != null && v !== '') fd.append(k, v);
    });
    (files ?? []).forEach(f => fd.append('response_documents', f));
    return fd;
};

export const respondToReferral = (id: number, data: {
    status: 'accepted' | 'in_progress' | 'rejected' | 'returned';
    response_notes?: string;
    return_requested_info?: string;
    appointment_date?: string;
    appointment_type?: 'in_person' | 'telemedicine';
}, files?: File[]) =>
    api.post(`/referrals/${id}/respond/`, withResponseFiles(data, files));

export const submitResult = (id: number, result: string, files?: File[]) =>
    api.post(`/referrals/${id}/result/`, withResponseFiles({ result }, files));

export const cancelReferral = (id: number, reason?: string) =>
    api.post(`/referrals/${id}/cancel/`, { reason: reason ?? '' });

export const recallReferral = (id: number, recall_reason?: string) =>
    api.post(`/referrals/${id}/recall/`, { recall_reason: recall_reason ?? '' });

export const getMessages = (id: number) =>
    api.get(`/referrals/${id}/messages/`);

export const sendMessage = (id: number, body: string) =>
    api.post(`/referrals/${id}/messages/`, { body });

export const deleteMessage = (referralId: number, msgId: number) =>
    api.delete(`/referrals/${referralId}/messages/${msgId}/`);

export const getEvents = (id: number) =>
    api.get(`/referrals/${id}/events/`);

export const getSnapshot = (id: number) =>
    api.get(`/referrals/${id}/snapshot/`);
