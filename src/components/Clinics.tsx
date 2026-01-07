import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { type Workplace } from '../types';
import { useAuth } from '../hooks/useAuth';
import './ListStyles.css';
const API_BASE_URL = 'http://127.0.0.1:8000/api';

const ClinicList = () => {
    const [clinics, setClinics] = useState<Workplace[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    //const navigate = useNavigate();
    // Nous avons besoin de 'token' pour les appels API et de 'user.id' pour vérifier la propriété.
    const { token, user } = useAuth();
    // Assurez-vous que l'ID de l'utilisateur est bien l'ID du docteur (comme dans ClinicDetail)
    const currentDoctorId = user?.id; 

    useEffect(() => {
        const fetchClinics = async () => {
            try {
                const response = await axios.get<Workplace[]>(`${API_BASE_URL}/workplaces/`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setClinics(response.data);
            } catch (err) {
                console.error("Erreur lors de la récupération des cliniques", err);
                setError("Impossible de charger la liste des cliniques.");
            } finally {
                setIsLoading(false);
            }
        };
        // N'exécutez le fetch que si le token est disponible
        if (token) {
            fetchClinics();
        }
    }, [token]);

    const handleDelete = async (clinicId: number) => {
        if (window.confirm("Êtes-vous sûr de vouloir supprimer cette clinique ?")) {
            try {
                await axios.delete(`${API_BASE_URL}/workplaces/${clinicId}/`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setClinics(clinics.filter(clinic => clinic.id !== clinicId));
            } catch (err) {
                console.error("Erreur lors de la suppression de la clinique", err);
                // Le message d'erreur est spécifique si l'utilisateur n'est pas le créateur.
                alert("Impossible de supprimer la clinique. Vous devez en être le créateur.");
            }
        }
    };

    if (isLoading) {
        return <div className="loading-text">Chargement des cliniques...</div>;
    }

    if (error) {
        return <div className="error-text">{error}</div>;
    }

    return (
        <div className="clinic-list-container">
            <div className="clinic-header">
                <h1 className="clinic-title">Liste des cliniques</h1>
                <Link to="/clinics/add" className="action-button add-clinic-button">
                    Ajouter une clinique
                </Link>
            </div>
            {clinics.length === 0 ? (
                <p className="no-clinic-message">Aucune clinique disponible pour le moment.</p>
            ) : (
                <ul className="clinic-items-list">
                    {clinics.map((clinic) => {
                        // VÉRIFICATION DE LA PROPRIÉTÉ DANS LA LISTE
                        const isCreator = clinic.creator === currentDoctorId;
                        return (
                            <li key={clinic.id} className="clinic-item">
                                <div className="clinic-info">
                                    <h2 className="clinic-name">{clinic.name}</h2>
                                    <p className="clinic-address">{clinic.address}</p>
                                    <p className="clinic-status">
                                        Statut : <span className={clinic.is_public ? 'status-public' : 'status-private'}>
                                            {clinic.is_public ? 'Publique' : 'Privée'}
                                        </span>
                                    </p>
                                </div>
                                <div className="clinic-actions">
                                    <Link to={`/clinics/${clinic.id}`} className="action-button details-button">
                                        Détails
                                    </Link>
                                    
                                    {/* NOUVEAU: Afficher les boutons d'action uniquement si l'utilisateur est le créateur */}
                                    {isCreator && (
                                        <>
                                            <Link to={`/clinics/edit/${clinic.id}`} className="action-button edit-button">
                                                Modifier
                                            </Link>
                                            <button 
                                                onClick={() => handleDelete(clinic.id)} 
                                                className="action-button delete-button"
                                            >
                                                Supprimer
                                            </button>
                                        </>
                                    )}
                                </div>
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
};

export default ClinicList;