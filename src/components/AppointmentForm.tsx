// Fichier : src/components/AppointmentForm.tsx

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../hooks/useAuth';
//import { useNavigate } from 'react-router-dom';
import { type Patient, type Workplace, type Appointment } from '../types';
import './AppointmentForm.css';

interface AppointmentFormProps {
    initialDate: Date;
    appointment?: Appointment | null;
    onSuccess: () => void;
    onCancel: () => void;
}

const API_BASE_URL = 'http://127.0.0.1:8000/api';

const AppointmentForm = ({ initialDate, appointment, onSuccess, onCancel }: AppointmentFormProps) => {
    const { token, profile } = useAuth();
    //const navigate = useNavigate();
    const [formData, setFormData] = useState({
        appointment_date: '',
        patient: '',
        workplace: '',
        reason_for_appointment: ''
    });
    const [patients, setPatients] = useState<Patient[]>([]);
    const [workplaces, setWorkplaces] = useState<Workplace[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchInitialData = async () => {
            if (!token) {
                setError("Vous n'êtes pas authentifié.");
                setLoading(false);
                return;
            }

            try {
                const patientsResponse = await axios.get<Patient[]>(`${API_BASE_URL}/patients/`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                setPatients(patientsResponse.data);

                const workplacesResponse = await axios.get<Workplace[]>(`${API_BASE_URL}/workplaces/`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                setWorkplaces(workplacesResponse.data);

                setLoading(false);
            } catch (err) {
                console.error("Erreur lors de la récupération des données initiales :", err);
                setError("Impossible de charger les patients ou les lieux de travail.");
                setLoading(false);
            }
        };
        fetchInitialData();
    }, [token]);

    useEffect(() => {
        if (!loading && appointment) {
            setFormData({
                appointment_date: appointment.appointment_date.slice(0, 16),
                // CORRECTION ICI : Utilisez `appointment.patient` directement car c'est déjà l'ID du patient.
                patient: appointment.patient,
                workplace: String(appointment.workplace),
                reason_for_appointment: appointment.reason_for_appointment
            });
        } else if (!loading) {
            const defaultDate = initialDate.toISOString().slice(0, 16);
            setFormData(prev => ({ ...prev, appointment_date: defaultDate }));
        }
    }, [loading, appointment, initialDate]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        const payload = {
            ...formData,
            doctor: profile?.id,
        };

        try {
            if (appointment) {
                await axios.put(`${API_BASE_URL}/appointments/${appointment.id}/`, payload, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
            } else {
                await axios.post(`${API_BASE_URL}/appointments/`, payload, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
            }
            onSuccess();
        } catch (err) {
            console.error("Erreur lors de la soumission du rendez-vous :", err);
            setError("Erreur lors de l'enregistrement du rendez-vous. Veuillez réessayer.");
        }
    };

    if (loading) {
        return <div className="loading-message">Chargement des données du formulaire...</div>;
    }

    if (error) {
        return <div className="error-message">{error}</div>;
    }

    return (
        <div className="form-modal-overlay">
            <div className="appointment-form-container">
                <h3>{appointment ? 'Modifier le rendez-vous' : 'Créer un rendez-vous'}</h3>
                <form onSubmit={handleSubmit} className="appointment-form">
                    <div className="form-group">
                        <label htmlFor="patient">Patient</label>
                        <select
                            id="patient"
                            name="patient"
                            value={formData.patient}
                            onChange={handleChange}
                            required
                        >
                            <option value="">Sélectionnez un patient</option>
                            {patients.map(patient => (
                                <option key={patient.unique_id} value={patient.unique_id}>
                                    {patient.first_name} {patient.last_name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label htmlFor="workplace">Lieu de travail</label>
                        <select
                            id="workplace"
                            name="workplace"
                            value={formData.workplace}
                            onChange={handleChange}
                            required
                        >
                            <option value="">Sélectionnez un lieu de travail</option>
                            {workplaces.map(workplace => (
                                <option key={workplace.id} value={workplace.id}>
                                    {workplace.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label htmlFor="appointment_date">Date et heure du rendez-vous</label>
                        <input
                            type="datetime-local"
                            id="appointment_date"
                            name="appointment_date"
                            value={formData.appointment_date}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="reason_for_appointment">Motif du rendez-vous</label>
                        <textarea
                            id="reason_for_appointment"
                            name="reason_for_appointment"
                            value={formData.reason_for_appointment}
                            onChange={handleChange}
                            rows={4}
                            required
                        ></textarea>
                    </div>

                    <div className="form-actions">
                        <button type="submit" className="submit-button">
                            {appointment ? 'Modifier' : 'Créer'}
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

export default AppointmentForm;