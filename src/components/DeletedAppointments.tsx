// Fichier : src/components/DeletedAppointments.tsx
import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../hooks/useAuth';
import './Appointments.css'; // Réutiliser les styles

const API_BASE_URL = 'http://127.0.0.1:8000/api';

const DeletedAppointments = () => {
    const { token } = useAuth();
    const [deletedAppointments, setDeletedAppointments] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchDeletedAppointments = async () => {
        setIsLoading(true);
        setError(null);
        if (!token) {
            setError("Vous n'êtes pas authentifié.");
            setIsLoading(false);
            return;
        }

        try {
            const response = await axios.get(`${API_BASE_URL}/appointments/deleted/`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            setDeletedAppointments(response.data);
        } catch (err) {
            console.error("Erreur lors de la récupération des rendez-vous supprimés :", err);
            setError("Impossible de charger les rendez-vous supprimés.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchDeletedAppointments();
    }, [token]);

    return (
        <div className="deleted-appointments-page">
            <h2>Rendez-vous supprimés</h2>
            {isLoading && <p>Chargement...</p>}
            {error && <p className="error-message">{error}</p>}
            {!isLoading && deletedAppointments.length === 0 ? (
                <p>Aucun rendez-vous supprimé n'a été trouvé.</p>
            ) : (
                <div className="appointments-list">
                    {deletedAppointments.map((appt: any) => (
                        <div key={appt.id} className="appointment-item deleted">
                            <p><strong>Patient:</strong> {appt.patient_details.first_name} {appt.patient_details.last_name}</p>
                            <p><strong>Médecin:</strong> {appt.doctor_details.full_name}</p>
                            <p><strong>Clinique:</strong> {appt.workplace_details.name}</p>
                            <p><strong>Date initiale:</strong> {new Date(appt.appointment_date).toLocaleString()}</p>
                            <p><strong>Supprimé le:</strong> {new Date(appt.deletion_date).toLocaleString()}</p>
                            <p><strong>Motif:</strong> {appt.deletion_reason}</p>
                            {appt.deletion_comment && <p><strong>Commentaire:</strong> {appt.deletion_comment}</p>}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default DeletedAppointments;