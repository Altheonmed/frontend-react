// Fichier : src/components/DeleteAppointmentModal.tsx
import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../hooks/useAuth';
import { type Appointment } from '../types';
import './FormStyles.css'; // Vous pouvez réutiliser les styles

interface DeleteAppointmentModalProps {
    appointment: Appointment;
    onSuccess: () => void;
    onCancel: () => void;
}

const API_BASE_URL = 'http://127.0.0.1:8000/api';

const REASON_OPTIONS = [
    { value: 'patient', label: 'Motif lié au patient' },
    { value: 'doctor', label: 'Motif lié au médecin' },
    { value: 'clinic', label: 'Motif lié à la clinique' },
    { value: 'external', label: 'Motifs externes' },
    { value: 'other', label: 'Autre' },
];

const DeleteAppointmentModal = ({ appointment, onSuccess, onCancel }: DeleteAppointmentModalProps) => {
    const { token } = useAuth();
    const [reason, setReason] = useState(REASON_OPTIONS[0].value);
    const [comment, setComment] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        if (!token) {
            setError("Authentification requise.");
            setLoading(false);
            return;
        }

        try {
            // L'API devra gérer la logique de suppression et d'enregistrement des motifs
            await axios.delete(`${API_BASE_URL}/appointments/${appointment.id}/`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                data: { // Envoyer les motifs dans le corps de la requête DELETE
                    reason: reason,
                    comment: comment
                }
            });

            onSuccess();
        } catch (err) {
            console.error("Erreur lors de la suppression du rendez-vous:", err);
            setError("Impossible de supprimer le rendez-vous. Veuillez réessayer.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="form-overlay">
            <div className="form-container">
                <form onSubmit={handleSubmit} className="form">
                    <h3>Confirmer la suppression</h3>
                    <p>Voulez-vous vraiment supprimer le rendez-vous avec le patient **{appointment.patient}** ?</p>
                    <p>Cette action est irréversible et sera enregistrée.</p>
                    {error && <p className="error-message">{error}</p>}

                    <div className="form-group">
                        <label htmlFor="reason">Motif de la suppression</label>
                        <select
                            id="reason"
                            name="reason"
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            required
                        >
                            {REASON_OPTIONS.map(option => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label htmlFor="comment">Commentaire supplémentaire</label>
                        <textarea
                            id="comment"
                            name="comment"
                            rows={3}
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            placeholder="Entrez un commentaire pour plus de détails."
                        ></textarea>
                    </div>
                    
                    <div className="form-actions">
                        <button type="submit" disabled={loading} className="delete-confirm-button">
                            {loading ? 'Suppression...' : 'Confirmer la suppression'}
                        </button>
                        <button type="button" onClick={onCancel} className="cancel-button">
                            Annuler
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default DeleteAppointmentModal;