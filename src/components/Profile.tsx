//import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { type Workplace } from '../types';
import './DetailStyles.css'; // Assurez-vous que le fichier CSS est bien importé

const Profile = () => {
    const { profile, authIsLoading } = useAuth();
    const navigate = useNavigate();

    const handleEditClick = () => {
        navigate('/edit-profile');
    };

    if (authIsLoading) {
        return <div className="loading-message">Chargement du profil...</div>;
    }

    if (!profile) {
        return <div className="no-profile-data">Aucune donnée de profil trouvée.</div>;
    }

    return (
        <div className="profile-container detail-container">
            <div className="profile-header detail-header">
                <h2 className="page-title">Mon Profil</h2>
                <button onClick={handleEditClick} className="edit-profile-button action-button">
                    Modifier mon profil
                </button>
            </div>
            
            <div className="profile-details detail-info-group">
                <p className="info-item"><strong>Nom complet:</strong> {profile.full_name}</p>
                <p className="info-item"><strong>Email:</strong> {profile.email}</p>
                <p className="info-item"><strong>Spécialité:</strong> {profile.specialty || 'Non spécifiée'}</p>
                <p className="info-item"><strong>Numéro de licence:</strong> {profile.license_number || 'Non spécifié'}</p>
                <p className="info-item"><strong>Adresse:</strong> {profile.address || 'Non spécifiée'}</p>
                
                <p className="info-item"><strong>Lieux de travail:</strong></p>
                {profile.workplaces && profile.workplaces.length > 0 ? (
                    <ul>
                        {profile.workplaces.map((workplace: Workplace) => (
                            <li key={workplace.id} className="detail-list-item">{workplace.name}</li>
                        ))}
                    </ul>
                ) : (
                    <p>Non spécifié</p>
                )}
            </div>
        </div>
    );
};

export default Profile;