import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../hooks/useAuth';
import { useNavigate, useParams } from 'react-router-dom';
import { type Workplace } from '../types';
import './FormStyles.css';

const API_BASE_URL = 'http://127.0.0.1:8000/api';

const ClinicForm = () => {
    const { id } = useParams<{ id?: string }>();
    const navigate = useNavigate();
    const { token } = useAuth();
    const [formData, setFormData] = useState<Partial<Workplace>>({
        name: '',
        address: '',
        is_public: false,
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // ... (fetchClinic useEffect, handleChange sont inchangés) ...
    useEffect(() => {
        if (id) {
            const fetchClinic = async () => {
                if (!token) {
                    setError("Authentification requise.");
                    return;
                }
                try {
                    const response = await axios.get(`${API_BASE_URL}/workplaces/${id}/`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    setFormData(response.data);
                } catch (err) {
                    console.error("Erreur lors du chargement des données de la clinique :", err);
                    setError("Clinique introuvable ou erreur de connexion.");
                }
            };
            fetchClinic();
        }
    }, [id, token]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type, checked } = e.target as HTMLInputElement;
        setFormData(prevData => ({
            ...prevData,
            [name]: type === 'checkbox' ? checked : value,
        }));
    };
    
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
            if (id) {
                // Mode Modification: Le backend doit valider si l'utilisateur est le créateur
                await axios.put(`${API_BASE_URL}/workplaces/${id}/`, formData, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                navigate(`/clinics/${id}`); // Rediriger vers les détails
            } else {
                // Mode Ajout
                const response = await axios.post(`${API_BASE_URL}/workplaces/`, formData, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                navigate(`/clinics/${response.data.id}`); // Rediriger vers les détails
            }
        } catch (err) {
            console.error("Erreur lors de l'enregistrement de la clinique :", err);
            if (axios.isAxiosError(err) && err.response) {
                // Afficher le message d'erreur du backend (ex: "Vous n'êtes pas le créateur")
                setError(JSON.stringify(err.response.data));
            } else {
                setError("Une erreur est survenue lors de l'enregistrement.");
            }
        } finally {
            setLoading(false);
        }
    };

    // ... (Rendu inchangé) ...
    return (
        <div className="form-overlay">
            <div className="form-container">
                <form onSubmit={handleSubmit} className="form">
                    <h3>{id ? 'Modifier la Clinique' : 'Ajouter une Clinique'}</h3>
                    {error && <p className="error-message">{error}</p>}
                    
                    <div className="form-group">
                        <label htmlFor="name">Nom</label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            value={formData.name || ''}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="address">Adresse</label>
                        <textarea
                            id="address"
                            name="address"
                            value={formData.address || ''}
                            onChange={handleChange}
                            required
                        ></textarea>
                    </div>

                    <div className="form-group checkbox-group">
                        <input
                            type="checkbox"
                            id="is_public"
                            name="is_public"
                            checked={formData.is_public || false}
                            onChange={handleChange}
                        />
                        <label htmlFor="is_public">Clinique publique</label>
                    </div>

                    <div className="form-actions">
                        <button type="submit" disabled={loading}>
                            {loading ? 'En cours...' : 'Enregistrer'}
                        </button>
                        <button type="button" onClick={() => navigate('/clinics')} className="cancel-button">
                            Annuler
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ClinicForm;