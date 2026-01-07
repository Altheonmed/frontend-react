// src/pages/EditPatientPage.tsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../hooks/useAuth';
import PatientForm from '../components/PatientForm';
import { type Patient } from '../types';

const EditPatientPage = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { token } = useAuth();
    const [patient, setPatient] = useState<Patient | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchPatient = async () => {
            if (!id || !token) {
                setLoading(false);
                setError('ID du patient ou jeton d\'authentification manquant.');
                return;
            }

            try {
                const response = await axios.get(`http://127.0.0.1:8000/api/patients/${id}/`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                setPatient(response.data);
                setLoading(false);
            } catch (err) {
                console.error('Erreur lors de la récupération du patient:', err);
                setError('Impossible de charger les données du patient pour la modification.');
                setLoading(false);
            }
        };

        fetchPatient();
    }, [id, token]);

    const handleSuccess = () => {
        // Redirige vers la liste des patients après la mise à jour
        navigate('/patients');
    };

    const handleCancel = () => {
        navigate('/patients');
    };

    if (loading) {
        return <div className="loading-message">Chargement des données du patient...</div>;
    }

    if (error) {
        return <div className="error-message">{error}</div>;
    }

    if (!patient) {
        return <div className="no-data-message">Patient non trouvé.</div>;
    }

    return (
        <div className="edit-patient-container">
            <PatientForm 
                patientToEdit={patient}
                onSuccess={handleSuccess}
                onCancel={handleCancel}
            />
        </div>
    );
};

export default EditPatientPage;