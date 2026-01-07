// Fichier : votre_app/components/ReferralForm.tsx

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../hooks/useAuth';
import { type DoctorProfile } from '../types';
import './FormStyles.css';

interface ReferralFormProps {
    patientId: string;
    onSuccess: () => void;
    onClose: () => void;
    referralToEdit?: any | null;
}

const ReferralForm: React.FC<ReferralFormProps> = ({ patientId, onSuccess, onClose, referralToEdit }) => {
    const { token } = useAuth();
    const [doctors, setDoctors] = useState<DoctorProfile[]>([]);
    const [formData, setFormData] = useState({
        referred_to: '',
        specialty_requested: '',
        reason_for_referral: '',
        comments: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchDoctors = async () => {
            if (!token) return;
            try {
                const response = await axios.get('http://127.0.0.1:8000/api/doctors/', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setDoctors(response.data);
            } catch (err) {
                console.error('Erreur lors de la récupération des docteurs:', err);
                setError('Impossible de charger la liste des médecins.');
            }
        };
        fetchDoctors();
    }, [token]);

    useEffect(() => {
        if (referralToEdit) {
            setFormData({
                referred_to: referralToEdit.referred_to?.id ? referralToEdit.referred_to.id.toString() : (referralToEdit.referred_to?.toString() || ''),
                specialty_requested: referralToEdit.specialty_requested || '',
                reason_for_referral: referralToEdit.reason_for_referral || '',
                comments: referralToEdit.comments || '',
            });
        } else {
            setFormData({
                referred_to: '',
                specialty_requested: '',
                reason_for_referral: '',
                comments: '',
            });
        }
    }, [referralToEdit]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        if (!token) {
            setError("Vous n'êtes pas authentifié.");
            setLoading(false);
            return;
        }

        if (!formData.referred_to) {
            setError("Veuillez sélectionner un médecin.");
            setLoading(false);
            return;
        }

        const referredToId = parseInt(formData.referred_to, 10);
        if (isNaN(referredToId)) {
            setError("ID de médecin invalide.");
            setLoading(false);
            return;
        }
        
        const payload = {
            ...formData,
            patient: patientId, // INCLUSION de l'ID du patient dans le payload
            referred_to: referredToId,
        };

        try {
            if (referralToEdit && referralToEdit.id) {
                // Modification (PUT)
                await axios.put(`http://127.0.0.1:8000/api/referrals/${referralToEdit.id}/`, payload, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            } else {
                // Création (POST)
                // CORRECTION DE L'URL
                await axios.post(`http://127.0.0.1:8000/api/referrals/`, payload, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            }
            onSuccess();
        } catch (err: any) {
            console.error('Erreur lors de la soumission du référencement:', err.response?.data || err.message);
            if (axios.isAxiosError(err) && err.response && err.response.data) {
                const errorMessages = Object.values(err.response.data).flat().join(' ');
                setError(`Erreur: ${errorMessages}`);
            } else {
                setError("Impossible de sauvegarder le référencement. Veuillez vérifier les informations.");
            }
        } finally {
            setLoading(false);
        }
    };

    const isEditing = !!referralToEdit;

    return (
        <div className="form-overlay">
            <div className="form-container">
                <h3>{isEditing ? 'Modifier le référencement' : 'Ajouter un référencement'}</h3>
                {error && <div className="error-message">{error}</div>}
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="referred_to">Médecin référé :</label>
                        <select
                            id="referred_to"
                            name="referred_to"
                            value={formData.referred_to}
                            onChange={handleChange}
                            required
                        >
                            <option value="">Sélectionnez un médecin</option>
                            {doctors.map(doctor => (
                                <option key={doctor.id} value={doctor.id}>
                                    Dr. {doctor.full_name} - {doctor.specialty}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="form-group">
                        <label htmlFor="specialty_requested">Spécialité demandée :</label>
                        <input
                            type="text"
                            id="specialty_requested"
                            name="specialty_requested"
                            value={formData.specialty_requested}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="reason_for_referral">Raison du référencement :</label>
                        <textarea
                            id="reason_for_referral"
                            name="reason_for_referral"
                            value={formData.reason_for_referral}
                            onChange={handleChange}
                            rows={4}
                            required
                        ></textarea>
                    </div>
                    <div className="form-group">
                        <label htmlFor="comments">Commentaires (optionnel) :</label>
                        <textarea
                            id="comments"
                            name="comments"
                            value={formData.comments}
                            onChange={handleChange}
                            rows={4}
                        ></textarea>
                    </div>
                    <div className="form-actions">
                        <button type="submit" className="submit-button" disabled={loading}>
                            {loading ? 'Envoi en cours...' : (isEditing ? 'Mettre à jour' : 'Créer le référencement')}
                        </button>
                        <button type="button" onClick={onClose} className="cancel-button">Annuler</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ReferralForm;