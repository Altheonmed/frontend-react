// Fichier : src/types.tsx
export interface User {
    id: number;
    email: string;
    full_name: string;
    specialty?: string | null;
    phone_number?: string | null;
    address?: string | null;
}

export interface DoctorProfile {
    id: number;
    full_name: string;
    email: string;
    specialty: string | null;
    license_number: string | null;
    phone_number: string | null;
    address: string | null;
    workplaces?: Workplace[];
}

export interface Patient {
    unique_id: string;
    first_name: string;
    last_name: string;
    date_of_birth: string | null;
    age: number | null;
    medical_history: string | null;
    blood_group: string | null;
    address: string | null;
    email: string | null;
    phone_number: string | null;
    emergency_contact_name: string | null;
    emergency_contact_number: string | null;
    allergies: string | null;
}

export interface Appointment {
    id: number;
    patient: string;
    doctor: number;
    appointment_date: string;
    reason_for_appointment: string;
    status: string;
    workplace: number;
     patient_details?: { // Type défini pour patient_details
        unique_id: string;
        first_name: string;
        last_name: string;
        // Ajoutez d'autres champs de Patient si nécessaire ici
    };
    workplace_details?: { // Type défini pour workplace_details
        id: number;
        name: string;
        address: string;
        // Ajoutez d'autres champs de Workplace si nécessaire ici
    };
}


export interface Workplace {
    id: number;
    name: string;
    address: string;
    is_public: boolean;
    creator: number;
}

export interface Consultation {
    id: number;
    patient: string; // ID du patient
    doctor: number; // ID du docteur
    consultation_date: string;
    reason_for_consultation: string;
    medical_report: string | null;
    diagnosis: string | null;
    medications: string | null;
    weight: number | null;
    height: number | null;
    sp2: number | null;
    temperature: number | null;
    blood_pressure: string | null;
}

export interface MedicalProcedure {
    id: number;
    patient: string; // ID du patient
    operator: number; // ID du docteur
    procedure_type: string;
    procedure_date: string;
    result: string | null;
    attachments: string | null; // URL du fichier joint
}

export interface DeletedAppointment {
    id: number;
    appointment_id: number; // L'ID original du rendez-vous
    patient_details: Patient; // Détails du patient au moment de la suppression
    doctor_details: DoctorProfile; // Détails du docteur
    workplace_details: Workplace; // Détails du lieu de travail
    appointment_date: string;
    reason_for_appointment: string;
    deletion_date: string;
    deletion_reason: string;
    deletion_comment: string | null;
    deleted_by_name: string; // Nom de l'utilisateur qui a supprimé
}
// Fichier : src/types.tsx
export interface Referral {
    id: number;
    patient: string;
    referred_to: number;
    referred_by: number;
    specialty_requested: string;
    reason_for_referral: string;
    attached_documents: string | null;
    date_of_referral: string;
    referral_date: string;
    reason: string;
    comments: string | null; // C'est le champ que nous allons utiliser
    // Les champs de détails enrichis
    referred_to_details?: DoctorProfile;
    referred_by_details?: DoctorProfile;
    patient_details?: Patient;
}
export interface PatientList {
    unique_id: string;
    first_name: string;
    last_name: string;
    date_of_birth: string;
    age: number;
}
// Le type étendu pour l'historique du patient, incluant les références
export interface PatientWithHistory extends Patient {
    consultations: Consultation[];
    medical_procedures: MedicalProcedure[];
    referrals: Referral[]; // Le nouveau champ
}

// ----------------------------------------------------------------------
// NOUVELLES INTERFACES POUR LES STATISTIQUES GLOBALES
// ----------------------------------------------------------------------

export interface WorkplaceStats {
    id: number;
    name: string;
    consultation_count: number;
    patient_count: number;
    procedure_count: number;
}

export interface DoctorStats {
    id: number;
    full_name: string;
    specialty: string;
    consultation_count: number;
    patient_count: number;
    referral_count: number;
    procedure_count: number;
}

export interface GlobalStats {
    total_doctors: number;
    total_workplaces: number;
    total_patients: number;
    total_consultations: number;
    total_referrals: number;
    total_procedures: number;
    stats_by_workplace: WorkplaceStats[];
    stats_by_doctor: DoctorStats[];
}


export interface AuthTokens {
    refresh: string;
    access: string;
}