import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../hooks/useAuth';
import './FormStyles.css'; // Changement ici !

// Ajout de l'interface pour la consultation
interface Consultation {
    id?: number; // Optionnel car absent lors de la création
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

// Ajout de la prop optionnelle consultationToEdit
interface ConsultationFormProps {
    patientId: string;
    onSuccess: () => void;
    onCancel: () => void;
    consultationToEdit?: Consultation | null;
}

const ConsultationForm = ({ patientId, onSuccess, onCancel, consultationToEdit }: ConsultationFormProps) => {
    const { token } = useAuth();
    const [formData, setFormData] = useState({
        reason_for_consultation: '',
        medical_report: '',
        diagnosis: '',
        medications: '',
        weight: '',
        height: '',
        sp2: '',
        temperature: '',
        blood_pressure: '',
    });
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    // Pré-remplir le formulaire si on est en mode modification
    useEffect(() => {
        if (consultationToEdit) {
            setFormData({
                reason_for_consultation: consultationToEdit.reason_for_consultation,
                medical_report: consultationToEdit.medical_report || '',
                diagnosis: consultationToEdit.diagnosis || '',
                medications: consultationToEdit.medications || '',
                weight: consultationToEdit.weight !== null ? String(consultationToEdit.weight) : '',
                height: consultationToEdit.height !== null ? String(consultationToEdit.height) : '',
                sp2: consultationToEdit.sp2 !== null ? String(consultationToEdit.sp2) : '',
                temperature: consultationToEdit.temperature !== null ? String(consultationToEdit.temperature) : '',
                blood_pressure: consultationToEdit.blood_pressure || '',
            });
        }
    }, [consultationToEdit]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prevData => ({
            ...prevData,
            [name]: value,
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setErrorMessage(null);

        if (!token) {
            setErrorMessage("Vous n'êtes pas authentifié.");
            setLoading(false);
            return;
        }

        try {
            const dataToSend = {
                ...formData,
                patient: patientId,
                weight: formData.weight ? parseFloat(formData.weight) : null,
                height: formData.height ? parseFloat(formData.height) : null,
                sp2: formData.sp2 ? parseFloat(formData.sp2) : null,
                temperature: formData.temperature ? parseFloat(formData.temperature) : null,
                blood_pressure: formData.blood_pressure || null,
            };

            let response;
            if (consultationToEdit && consultationToEdit.id) {
                // Modification (PUT)
                response = await axios.put(
                    `http://127.0.0.1:8000/api/consultations/${consultationToEdit.id}/`,
                    dataToSend,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                            'Content-Type': 'application/json',
                        },
                    }
                );
            } else {
                // Création (POST)
                response = await axios.post('http://127.0.0.1:8000/api/consultations/', dataToSend, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                });
            }

            if (response.status === 201 || response.status === 200) {
                onSuccess();
            }
        } catch (err) {
            console.error('Erreur lors de l\'enregistrement de la consultation:', err);
            if (axios.isAxiosError(err) && err.response) {
                const errorData = err.response.data;
                const errorMessages = Object.values(errorData).flat().join(' ');
                setErrorMessage(`Erreur: ${errorMessages}`);
            } else {
                setErrorMessage('Une erreur est survenue lors de l\'enregistrement de la consultation.');
            }
        } finally {
            setLoading(false);
        }
    };

    const isEditing = !!consultationToEdit;

    return (
        <div className="form-overlay"> {/* Changement de classe ici */}
            <div className="form-container"> {/* Changement de classe ici */}
                <h3>{isEditing ? 'Modifier la consultation' : 'Ajouter une nouvelle consultation'}</h3>
                {errorMessage && <div className="error-message">{errorMessage}</div>}
                <form onSubmit={handleSubmit} className="form"> {/* Changement de classe ici */}
                    {/* Partie 1 : Champs des données physiques */}
                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="weight">Poids (kg)</label>
                            <input type="number" step="0.01" id="weight" name="weight" value={formData.weight} onChange={handleChange} />
                        </div>
                        <div className="form-group">
                            <label htmlFor="height">Taille (m)</label>
                            <input type="number" step="0.01" id="height" name="height" value={formData.height} onChange={handleChange} />
                        </div>
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="temperature">Température (°C)</label>
                            <input type="number" step="0.01" id="temperature" name="temperature" value={formData.temperature} onChange={handleChange} />
                        </div>
                        <div className="form-group">
                            <label htmlFor="sp2">SpO2 (%)</label>
                            <input type="number" step="0.01" id="sp2" name="sp2" value={formData.sp2} onChange={handleChange} />
                        </div>
                    </div>
                    <div className="form-group">
                        <label htmlFor="blood_pressure">Tension artérielle</label>
                        <input type="text" id="blood_pressure" name="blood_pressure" value={formData.blood_pressure} onChange={handleChange} />
                    </div>

                    <hr />

                    {/* Partie 2 : Champs des motifs de consultation et symptômes */}
                    <div className="form-group">
                        <label htmlFor="reason_for_consultation">Motif de la consultation <span className="required">*</span></label>
                        <textarea id="reason_for_consultation" name="reason_for_consultation" value={formData.reason_for_consultation} onChange={handleChange} required rows={3} />
                    </div>
                    <div className="form-group">
                        <label htmlFor="diagnosis">Diagnostic</label>
                        <textarea id="diagnosis" name="diagnosis" value={formData.diagnosis} onChange={handleChange} rows={3} />
                    </div>
                    <div className="form-group">
                        <label htmlFor="medical_report">Rapport médical</label>
                        <textarea id="medical_report" name="medical_report" value={formData.medical_report} onChange={handleChange} rows={5} />
                    </div>
                    <div className="form-group">
                        <label htmlFor="medications">Médicaments prescrits</label>
                        <textarea id="medications" name="medications" value={formData.medications} onChange={handleChange} rows={3} />
                    </div>

                    <div className="form-actions">
                        <button type="submit" disabled={loading}>
                            {loading ? 'En cours...' : (isEditing ? 'Mettre à jour' : 'Enregistrer')}
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

export default ConsultationForm;