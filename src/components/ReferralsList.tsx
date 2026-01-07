// Fichier : src/components/ReferralsList.tsx

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../hooks/useAuth';
import { type Referral } from '../types';
import './DetailStyles.css';
import { Link } from 'react-router-dom';

interface ReferralsListProps {}

const ReferralsList: React.FC<ReferralsListProps> = () => {
    const { token } = useAuth();
    const [referrals, setReferrals] = useState<Referral[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchReferrals = async () => {
            if (!token) {
                setError("Vous n'êtes pas authentifié.");
                setLoading(false);
                return;
            }
            try {
                const response = await axios.get(`http://127.0.0.1:8000/api/referrals/`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setReferrals(response.data);
                setError(null);
            } catch (err) {
                console.error('Erreur lors de la récupération des référencements:', err);
                setError('Impossible de charger la liste des référencements.');
            } finally {
                setLoading(false);
            }
        };

        fetchReferrals();
    }, [token]);

    if (loading) {
        return <div className="loading-message">Chargement des référencements...</div>;
    }

    if (error) {
        return <div className="error-message">{error}</div>;
    }

    return (
        <div className="patients-container">
            <h2 className="page-title">Toutes les Références</h2>
            {referrals.length === 0 ? (
                <p className="no-patients-message">Il n'y a pas encore de référencements.</p>
            ) : (
                <ul className="patients-list">
                    {referrals.map(referral => (
                        <li key={referral.id} className="patient-card">
                            <div className="patient-info">
                                <h4>
                                    Référencement du patient : 
                                    <Link to={`/patients/${referral.patient_details?.unique_id}`} className="patient-link">
                                        {referral.patient_details?.first_name} {referral.patient_details?.last_name || ''}
                                    </Link>
                                </h4>
                                <p><strong>Spécialité demandée :</strong> {referral.specialty_requested}</p>
                                <p><strong>Raison :</strong> {referral.reason_for_referral}</p>
                                <p className="date-info">
                                    Créé le {new Date(referral.date_of_referral).toLocaleDateString()} par Dr. {referral.referred_by_details?.full_name}
                                </p>
                                <p><strong>Référence à :</strong> Dr. {referral.referred_to_details?.full_name}</p>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default ReferralsList;