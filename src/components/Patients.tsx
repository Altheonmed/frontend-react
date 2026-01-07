// Fichier : src/components/Patients.tsx

import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../hooks/useAuth';
import { Link, useNavigate } from 'react-router-dom';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import './ListStyles.css';
import { type Patient } from '../types';

interface PatientsProps {
    refreshPatients?: boolean;
}

const Patients = ({ refreshPatients }: PatientsProps) => {
    const { token } = useAuth();
    const [patients, setPatients] = useState<Patient[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const navigate = useNavigate();

    const fetchPatients = async () => {
        if (!token) {
            setError("Vous n'êtes pas authentifié.");
            setLoading(false);
            return;
        }

        try {
            const response = await axios.get('http://127.0.0.1:8000/api/doctors/me/patients/', {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            setPatients(response.data);
            setError(null);
        } catch (err) {
            console.error('Erreur lors de la récupération des patients:', err);
            setError('Impossible de charger la liste des patients.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPatients();
    }, [token, refreshPatients]);

    const handleAddPatientClick = () => {
        navigate('/patients/add');
    };

    const handleEditPatient = (patientId: string) => {
        navigate(`/patients/edit/${patientId}`);
    };

    const handleDeletePatient = async (patientId: string) => {
        if (!window.confirm("Êtes-vous sûr de vouloir supprimer ce patient ? Cette action est irréversible.")) {
            return;
        }
        
        if (!token) {
            setError("Vous n'êtes pas authentifié.");
            return;
        }

        try {
            await axios.delete(`http://127.0.0.1:8000/api/patients/${patientId}/`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            setPatients(patients.filter(patient => patient.unique_id !== patientId));
            console.log(`Patient ${patientId} supprimé avec succès.`);
        } catch (err) {
            console.error('Erreur lors de la suppression du patient:', err);
            setError('Impossible de supprimer le patient. Veuillez réessayer.');
        }
    };

    const handleExportPdf = async () => {
        const input = document.getElementById('patients-list-to-export');
        if (input) {
            try {
                const canvas = await html2canvas(input, { scale: 2 });
                const imgData = canvas.toDataURL('image/png');
                
                const pdf = new jsPDF('p', 'mm', 'a4');
                const imgProps= pdf.getImageProperties(imgData);
                const pdfWidth = pdf.internal.pageSize.getWidth();
                const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

                pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
                pdf.save("liste-des-patients.pdf");

            } catch (err) {
                console.error("Erreur lors de la création du PDF:", err);
                setError("Impossible de générer le fichier PDF.");
            }
        }
    };

    // Logique de filtrage mise à jour pour le nom complet
    const filteredPatients = patients.filter(patient =>
        `${patient.first_name} ${patient.last_name}`.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return <div className="loading-message">Chargement des patients...</div>;
    }

    if (error) {
        return <div className="error-message">{error}</div>;
    }

    return (
        <div className="patients-container">
            <div className="patients-header">
                <h2 className="page-title">Mes Patients</h2>
                <div className="header-buttons">
                    <button onClick={handleAddPatientClick} className="action-button add-button">
                        Ajouter un Patient
                    </button>
                    <button onClick={handleExportPdf} className="action-button export-button">
                        Exporter en PDF
                    </button>
                </div>
            </div>
            
            <div className="search-container">
                <input
                    type="text"
                    placeholder="Rechercher par nom..."
                    className="search-input"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            
            <div id="patients-list-to-export" className="patients-list">
                {filteredPatients.length > 0 ? (
                    filteredPatients.map((patient) => (
                        <div key={patient.unique_id} className="patient-card">
                            <div className="patient-info">
                                <h3 className="patient-name">{patient.first_name} {patient.last_name}</h3>
                                <p className="patient-dob"><strong>Date de naissance:</strong> {patient.date_of_birth || 'Non spécifiée'}</p>
                            </div>
                            <div className="patient-actions">
                                <Link to={`/patients/${patient.unique_id}`} className="action-button details-button">
                                    Voir le dossier
                                </Link>
                                <button
                                    onClick={() => handleEditPatient(patient.unique_id)}
                                    className="action-button edit-button"
                                >
                                    Modifier
                                </button>
                                <button
                                    onClick={() => handleDeletePatient(patient.unique_id)}
                                    className="action-button delete-button"
                                >
                                    Supprimer
                                </button>
                            </div>
                        </div>
                    ))
                ) : (
                    <p className="no-patients-message">Aucun patient trouvé.</p>
                )}
            </div>
        </div>
    );
};

export default Patients;