// Fichier : src/components/EditProfile.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Select from 'react-select';
import { useAuth } from '../hooks/useAuth';
import { type DoctorProfile, type Workplace } from '../types';
import './FormStyles.css';

const API_BASE_URL = 'http://127.0.0.1:8000/api';

const EditProfile = () => {
    const { profile, updateProfileData, token } = useAuth();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        email: '',
        specialty: '',
        license_number: '',
        phone_number: '',
        address: '',
    });
    const [workplaces, setWorkplaces] = useState<Workplace[]>([]);
    const [selectedWorkplaces, setSelectedWorkplaces] = useState<Workplace[]>([]);
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            if (!token) {
                setError("Authentification requise.");
                setInitialLoading(false);
                return;
            }
            
            try {
                // Récupérer la liste de toutes les cliniques
                const workplacesResponse = await axios.get(`${API_BASE_URL}/workplaces/`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const allWorkplaces: Workplace[] = workplacesResponse.data;
                setWorkplaces(allWorkplaces);

                // Charger les données du profil du médecin
                if (profile) {
                    const nameParts = profile.full_name.split(' ');
                    const firstName = nameParts.shift() || '';
                    const lastName = nameParts.join(' ');
                    
                    setFormData({
                        first_name: firstName,
                        last_name: lastName,
                        email: profile.email,
                        specialty: profile.specialty || '',
                        license_number: profile.license_number || '',
                        phone_number: profile.phone_number || '',
                        address: profile.address || '',
                    });
                    
                    // Pré-sélectionner les cliniques du médecin
                    if (profile.workplaces) {
                        const preselected = allWorkplaces.filter(w => 
                            profile.workplaces?.some(pw => pw.id === w.id)
                        );
                        setSelectedWorkplaces(preselected);
                    }
                }
            } catch (err) {
                console.error("Erreur lors du chargement des données :", err);
                if (axios.isAxiosError(err) && err.response) {
                    setError(`Erreur de l'API : ${JSON.stringify(err.response.data)}`);
                } else {
                    setError("Une erreur est survenue lors du chargement des données.");
                }
            } finally {
                setInitialLoading(false);
            }
        };

        fetchData();
    }, [profile, token]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prevData => ({
            ...prevData,
            [name]: value,
        }));
    };

    const handleSelectChange = (newValue: any) => {
        setSelectedWorkplaces(newValue);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            // Créer le payload en incluant le tableau d'IDs de lieux de travail
            const payload = {
                ...formData,
                workplaces: selectedWorkplaces.map(w => w.id),
            };

            const response = await axios.put(`${API_BASE_URL}/profile/update/`, payload, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            // Reconstruire l'objet DoctorProfile complet à partir de la réponse de l'API
            // IMPORTANT: Assurez-vous que l'API renvoie les objets Workplace complets,
            // ou bien récupérez-les à nouveau ici pour mettre à jour le contexte.
            // La solution la plus simple est d'attendre que le backend renvoie la bonne structure.
            // Sinon, il faudrait faire une nouvelle requête ici.
            
            // Pour l'instant, nous faisons confiance au backend pour renvoyer la bonne structure.
            const updatedProfile: DoctorProfile = {
                id: response.data.id,
                full_name: `${response.data.first_name} ${response.data.last_name}`,
                email: response.data.email,
                specialty: response.data.specialty,
                license_number: response.data.license_number,
                phone_number: response.data.phone_number,
                address: response.data.address,
                workplaces: response.data.workplaces,
            };
            
            updateProfileData(updatedProfile);
            
            navigate('/profile');
        } catch (err) {
            console.error("Erreur lors de la mise à jour du profil :", err);
            if (axios.isAxiosError(err) && err.response) {
                setError(JSON.stringify(err.response.data));
            } else {
                setError("Une erreur est survenue lors de l'enregistrement.");
            }
        } finally {
            setLoading(false);
        }
    };
    
    if (initialLoading) {
        return <div>Chargement du profil...</div>;
    }

    if (!profile) {
        return <div>Impossible de charger les données du profil.</div>;
    }

    const options = workplaces.map(w => ({
        value: w.id,
        label: w.name,
        ...w
    }));

    const defaultValues = selectedWorkplaces.map(w => ({
        value: w.id,
        label: w.name,
        ...w
    }));

    return (
        <div className="form-overlay">
            <div className="form-container">
                <form onSubmit={handleSubmit} className="form">
                    <h3>Modifier le Profil</h3>
                    {error && <p className="error-message">{error}</p>}
                    
                    <div className="form-group">
                        <label htmlFor="first_name">Prénom</label>
                        <input type="text" id="first_name" name="first_name" value={formData.first_name} onChange={handleChange} required />
                    </div>
                    <div className="form-group">
                        <label htmlFor="last_name">Nom</label>
                        <input type="text" id="last_name" name="last_name" value={formData.last_name} onChange={handleChange} required />
                    </div>
                    <div className="form-group">
                        <label htmlFor="email">Email</label>
                        <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} required />
                    </div>
                    <div className="form-group">
                        <label htmlFor="specialty">Spécialité</label>
                        <input type="text" id="specialty" name="specialty" value={formData.specialty} onChange={handleChange} />
                    </div>
                    <div className="form-group">
                        <label htmlFor="license_number">Numéro de licence</label>
                        <input type="text" id="license_number" name="license_number" value={formData.license_number} onChange={handleChange} />
                    </div>
                    <div className="form-group">
                        <label htmlFor="phone_number">Numéro de téléphone</label>
                        <input type="text" id="phone_number" name="phone_number" value={formData.phone_number} onChange={handleChange} />
                    </div>
                    <div className="form-group">
                        <label htmlFor="address">Adresse</label>
                        <textarea id="address" name="address" value={formData.address} onChange={handleChange}></textarea>
                    </div>

                    <div className="form-group">
                        <label>Lieux de travail</label>
                        <Select
                            isMulti
                            options={options}
                            value={defaultValues}
                            onChange={handleSelectChange}
                            placeholder="Rechercher et sélectionner des cliniques..."
                        />
                    </div>

                    <div className="form-actions">
                        <button type="submit" disabled={loading}>
                            {loading ? 'En cours...' : 'Enregistrer'}
                        </button>
                        <button type="button" onClick={() => navigate('/profile')} className="cancel-button">
                            Annuler
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditProfile;