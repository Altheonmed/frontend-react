import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../hooks/useAuth';
import './FormStyles.css';

// Ajout de l'interface pour l'acte médical
interface MedicalProcedure {
    id?: number;
    procedure_type: string;
    procedure_date: string;
    result: string | null;
    attachments: string | null;
}

// Ajout de la prop optionnelle `procedureToEdit`
interface MedicalProcedureFormProps {
    patientId: string;
    onSuccess: () => void;
    onCancel: () => void;
    procedureToEdit?: MedicalProcedure | null;
}

const MedicalProcedureForm = ({ patientId, onSuccess, onCancel, procedureToEdit }: MedicalProcedureFormProps) => {
    // Déclaration explicite du type pour éviter l'erreur
    type FormData = {
        procedure_type: string;
        procedure_date: string;
        result: string;
        attachments: File | null;
    };
    
    const { token } = useAuth();

    const [formData, setFormData] = useState<FormData>({
        procedure_type: '',
        procedure_date: '',
        result: '',
        attachments: null,
    });
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    // Pré-remplir le formulaire si on est en mode modification
    useEffect(() => {
        if (procedureToEdit) {
            setFormData({
                procedure_type: procedureToEdit.procedure_type,
                procedure_date: procedureToEdit.procedure_date,
                result: procedureToEdit.result || '',
                attachments: null, // Les pièces jointes ne peuvent pas être pré-remplies de cette manière
            });
        }
    }, [procedureToEdit]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, files } = e.target as HTMLInputElement;
        if (name === "attachments" && files && files.length > 0) {
            setFormData(prevData => ({
                ...prevData,
                attachments: files[0],
            }));
        } else {
            setFormData(prevData => ({
                ...prevData,
                [name]: value,
            }));
        }
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

        const dataToSend = new FormData();
        dataToSend.append('patient', patientId);
        dataToSend.append('procedure_type', formData.procedure_type);
        dataToSend.append('procedure_date', formData.procedure_date);
        dataToSend.append('result', formData.result);
        if (formData.attachments) {
            dataToSend.append('attachments', formData.attachments);
        }

        try {
            let response;
            if (procedureToEdit && procedureToEdit.id) {
                // Modification (PUT)
                // Notez que pour les FormData, la méthode PUT/PATCH peut nécessiter une configuration spécifique
                // du backend pour accepter ce type de requête.
                // Ici, on utilise PATCH pour ne mettre à jour que les champs modifiés
                response = await axios.patch(
                    `http://127.0.0.1:8000/api/medical-procedures/${procedureToEdit.id}/`,
                    dataToSend,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                            'Content-Type': 'multipart/form-data',
                        },
                    }
                );
            } else {
                // Création (POST)
                response = await axios.post('http://127.0.0.1:8000/api/medical-procedures/', dataToSend, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'multipart/form-data',
                    },
                });
            }

            if (response.status === 201 || response.status === 200) {
                onSuccess();
            }
        } catch (err) {
            console.error('Erreur lors de l\'enregistrement de l\'acte médical:', err);
            if (axios.isAxiosError(err) && err.response) {
                const errorData = err.response.data;
                const errorMessages = Object.values(errorData).flat().join(' ');
                setErrorMessage(`Erreur: ${errorMessages}`);
            } else {
                setErrorMessage('Une erreur est survenue lors de l\'enregistrement de l\'acte médical.');
            }
        } finally {
            setLoading(false);
        }
    };

    const isEditing = !!procedureToEdit;

    return (
        <div className="form-overlay">
            <div className="form-container">
                <h3>{isEditing ? 'Modifier l\'acte médical' : 'Ajouter un acte médical'}</h3>
                {errorMessage && <div className="error-message">{errorMessage}</div>}
                <form onSubmit={handleSubmit} className="form">
                    <div className="form-group">
                        <label htmlFor="procedure_type">Type d'acte <span className="required">*</span></label>
                        <input type="text" id="procedure_type" name="procedure_type" value={formData.procedure_type} onChange={handleChange} required />
                    </div>
                    <div className="form-group">
                        <label htmlFor="procedure_date">Date de l'acte <span className="required">*</span></label>
                        <input type="date" id="procedure_date" name="procedure_date" value={formData.procedure_date} onChange={handleChange} required />
                    </div>
                    <div className="form-group">
                        <label htmlFor="result">Résultat</label>
                        <textarea id="result" name="result" value={formData.result} onChange={handleChange} rows={5} />
                    </div>
                    <div className="form-group">
                        <label htmlFor="attachments">Pièces jointes</label>
                        <input type="file" id="attachments" name="attachments" onChange={handleChange} />
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

export default MedicalProcedureForm;