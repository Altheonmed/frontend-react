//import React from 'react';
import PatientForm from './PatientForm';
import { useNavigate } from 'react-router-dom';
import './AddPatient.css';

interface AddPatientProps {
    onPatientAdded: () => void;
}

const AddPatient = ({ onPatientAdded }: AddPatientProps) => {
    const navigate = useNavigate();

    const handleBackClick = () => {
        navigate('/patients');
    };

    const handleCancel = () => {
        // Appeler la même fonction de navigation pour retourner à la liste des patients
        navigate('/patients');
    };

    return (
        <div className="add-patient-container">
            <div className="add-patient-header">
                <button onClick={handleBackClick} className="back-button">
                    Retour à la liste des patients
                </button>
                <h2 className="page-title">Ajouter un Nouveau Patient</h2>
            </div>
            <PatientForm onSuccess={onPatientAdded} onCancel={handleCancel} />
        </div>
    );
};

export default AddPatient;