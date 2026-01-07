// Fichier : src/components/Statistics.tsx

import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../hooks/useAuth';
import './DetailStyles.css';
import './ListStyles.css';
import './TextStyles.css';
import './Dashboard.css'; // Importez les styles du tableau de bord pour les cartes de stats

const API_BASE_URL = 'http://127.0.0.1:8000/api';

interface Stats {
    total_patients: number;
    total_consultations: number;
    total_medical_procedures: number;
    patients: PatientStat[];
}

interface PatientStat {
    unique_id: string;
    full_name: string;
    consultations_count: number;
    medical_procedures_count: number;
    referrals_count: number;
}

const Statistics = () => {
    const { token } = useAuth();
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchStatistics = async () => {
            if (!token) {
                setError("Authentification requise pour voir les statistiques.");
                setLoading(false);
                return;
            }

            try {
                const statsResponse = await axios.get(`${API_BASE_URL}/doctors/stats/`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const patientsResponse = await axios.get(`${API_BASE_URL}/doctors/patients/stats/`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                setStats({
                    total_patients: statsResponse.data.total_patients,
                    total_consultations: statsResponse.data.total_consultations,
                    total_medical_procedures: statsResponse.data.total_medical_procedures,
                    patients: patientsResponse.data
                });
            } catch (err) {
                console.error("Erreur lors du chargement des statistiques:", err);
                setError("Impossible de charger les statistiques.");
            } finally {
                setLoading(false);
            }
        };

        fetchStatistics();
    }, [token]);

    if (loading) {
        return <div className="text-page-container loading-message">Chargement des statistiques...</div>;
    }

    if (error) {
        return <div className="text-page-container error-message">{error}</div>;
    }

    return (
        <div className="text-page-container">
            <div className="page-header">
                <h1>Vos Statistiques</h1>
            </div>

            {/* Section des statistiques générales affichée horizontalement */}
            <div className="stats-summary">
                <div className="stat-card">
                    <p className="stat-value">{stats?.total_patients ?? 0}</p>
                    <p className="stat-label">Patients</p>
                </div>
                <div className="stat-card">
                    <p className="stat-value">{stats?.total_consultations ?? 0}</p>
                    <p className="stat-label">Consultations</p>
                </div>
                <div className="stat-card">
                    <p className="stat-value">{stats?.total_medical_procedures ?? 0}</p>
                    <p className="stat-label">Actes Médicaux</p>
                </div>
            </div>
            
            <div className="separator"></div>

            {/* Tableau des patients */}
            <div className="content-section">
                <h2>Statistiques par Patient</h2>
                {stats?.patients && stats.patients.length > 0 ? (
                    <table className="patients-stats-table">
                        <thead>
                            <tr>
                                <th style={{ width: '40%' }}>Nom du Patient</th>
                                <th style={{ width: '20%' }}>Consultations</th>
                                <th style={{ width: '20%' }}>Actes Médicaux</th>
                                <th style={{ width: '20%' }}>Référencements</th>
                            </tr>
                        </thead>
                        <tbody>
                            {stats.patients.map(patient => (
                                <tr key={patient.unique_id}>
                                    <td>{patient.full_name}</td>
                                    <td>{patient.consultations_count}</td>
                                    <td>{patient.medical_procedures_count}</td>
                                    <td>{patient.referrals_count}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <p className="no-data-message">Aucune donnée de patient à afficher.</p>
                )}
            </div>
        </div>
    );
};

export default Statistics;