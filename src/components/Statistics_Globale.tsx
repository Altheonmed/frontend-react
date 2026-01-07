import { useState, useEffect, useCallback, useMemo } from 'react';
import { type GlobalStats, type WorkplaceStats, type DoctorStats } from '../types';
import { fetchProtectedData } from '../utils/api'; 
import { useAuth } from '../hooks/useAuth'; 
import './Statistics.css'; 

// Définition du type pour la configuration de tri
interface SortConfig {
    key: 'name' | 'full_name' | 'patient_count' | 'consultation_count' | 'procedure_count' | 'referral_count' | 'specialty' | null;
    direction: 'ascending' | 'descending';
}

function Statistics_Globale() { 
    const { isAuthenticated, logout, authIsLoading } = useAuth(); 
    
    const [stats, setStats] = useState<GlobalStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // ÉTATS POUR LA RECHERCHE ET LE TRI
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [workplaceSortConfig, setWorkplaceSortConfig] = useState<SortConfig>({ key: null, direction: 'ascending' });
    const [doctorSortConfig, setDoctorSortConfig] = useState<SortConfig>({ key: null, direction: 'ascending' });

    // --- LOGIQUE D'APPEL API ---
    const loadStats = useCallback(async () => {
        if (!isAuthenticated || authIsLoading) {
            setLoading(false);
            return;
        }

        setLoading(true);
        try {
            const data: GlobalStats = await fetchProtectedData('stats/global/');
            setStats(data);
            setError(null);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Une erreur inconnue est survenue.";
            console.error("Erreur lors du chargement des statistiques globales :", err);
            
            if (errorMessage.includes("Jeton d'accès manquant") || errorMessage.includes("Accès non autorisé")) {
                logout(); 
                return; 
            }
            
            setError("Impossible de charger les statistiques globales. Veuillez réessayer. Détails: " + errorMessage);
        } finally {
            setLoading(false);
        }
    }, [isAuthenticated, authIsLoading, logout]);

    useEffect(() => {
        if (isAuthenticated && !authIsLoading) {
            loadStats();
        } 
    }, [loadStats, isAuthenticated, authIsLoading]);
    
    // --- LOGIQUE DE TRI ---

    const sortData = (data: (WorkplaceStats | DoctorStats)[], config: SortConfig) => {
        if (!config.key) return data;

        const sortedData = [...data].sort((a, b) => {
            // Le type assertion est nécessaire car 'key' peut être dans WorkplaceStats ou DoctorStats,
            // mais l'appelant s'assure qu'il est pertinent pour le type de données passé.
            const key = config.key as keyof (WorkplaceStats | DoctorStats); 
            const valA = a[key];
            const valB = b[key];

            let comparison = 0;
            if (valA > valB) {
                comparison = 1;
            } else if (valA < valB) {
                comparison = -1;
            }

            return config.direction === 'ascending' ? comparison : comparison * -1;
        });
        return sortedData;
    };

    const requestSort = (key: SortConfig['key'], type: 'workplace' | 'doctor') => {
        const currentConfig = type === 'workplace' ? workplaceSortConfig : doctorSortConfig;
        let direction: SortConfig['direction'] = 'ascending';

        // Si la même colonne est cliquée, inverser la direction
        if (currentConfig.key === key && currentConfig.direction === 'ascending') {
            direction = 'descending';
        }

        const newConfig = { key, direction };
        if (type === 'workplace') {
            setWorkplaceSortConfig(newConfig);
        } else {
            setDoctorSortConfig(newConfig);
        }
    };

    // --- LOGIQUE DE FILTRAGE ET TRI DANS useMemo ---

    const filteredAndSortedWorkplaces = useMemo(() => {
        if (!stats) return [];
        let data = stats.stats_by_workplace;
        
        // 1. Filtrage par clinique
        if (searchTerm) {
            const lowerCaseSearch = searchTerm.toLowerCase();
            data = data.filter(w => w.name.toLowerCase().includes(lowerCaseSearch));
        }

        // 2. Tri
        return sortData(data, workplaceSortConfig) as WorkplaceStats[];
    }, [stats, searchTerm, workplaceSortConfig]);


    const filteredAndSortedDoctors = useMemo(() => {
        if (!stats) return [];
        let data = stats.stats_by_doctor;
        
        // 1. Filtrage par médecin ou spécialité
        if (searchTerm) {
            const lowerCaseSearch = searchTerm.toLowerCase();
            data = data.filter(d => 
                d.full_name.toLowerCase().includes(lowerCaseSearch) || // Utilise full_name
                d.specialty.toLowerCase().includes(lowerCaseSearch)
            );
        }

        // 2. Tri
        return sortData(data, doctorSortConfig) as DoctorStats[];
    }, [stats, searchTerm, doctorSortConfig]);


    // --- Rendu conditionnel et Composants ---
    
    if (authIsLoading || loading) {
        return <div className="stats-container">Chargement des statistiques globales...</div>;
    }

    if (!isAuthenticated) {
        return <div className="stats-container">Accès non autorisé.</div>;
    }

    if (error) {
        return <div className="stats-container stats-error">Erreur : {error}</div>;
    }

    if (!stats) {
        return <div className="stats-container">Aucune donnée statistique globale disponible.</div>;
    }
    
    // Fonction d'aide pour l'icône de tri
    const getSortIcon = (key: SortConfig['key'], config: SortConfig) => {
        if (config.key !== key) return '↕';
        return config.direction === 'ascending' ? '▲' : '▼';
    };
    
    // --- Composant de Contrôles de Recherche et Tri ---
    const renderControls = () => (
        <section className="stats-section stats-controls">
            <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                <label style={{ fontWeight: 'bold' }}>
                    Rechercher par Clinique ou Médecin:
                </label>
                <input
                    type="text"
                    placeholder="Entrez le nom de la clinique/médecin..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc', flexGrow: 1 }}
                />
            </div>
        </section>
    );

    // --- Rendu des Statistiques par Clinique ---
    const renderWorkplaceStats = () => (
        <section className="stats-section">
            <h2>Statistiques par Clinique (Workplace)</h2>
            <div className="stats-table-container">
                <table className="stats-table">
                    <thead>
                        <tr>
                            <th onClick={() => requestSort('name', 'workplace')}>
                                Clinique {getSortIcon('name', workplaceSortConfig)}
                            </th>
                            <th onClick={() => requestSort('patient_count', 'workplace')}>
                                Patients gérés {getSortIcon('patient_count', workplaceSortConfig)}
                            </th>
                            <th onClick={() => requestSort('consultation_count', 'workplace')}>
                                Consultations {getSortIcon('consultation_count', workplaceSortConfig)}
                            </th>
                            <th onClick={() => requestSort('procedure_count', 'workplace')}>
                                Actes Médicaux {getSortIcon('procedure_count', workplaceSortConfig)}
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredAndSortedWorkplaces.length > 0 ? (
                            filteredAndSortedWorkplaces.map((w: WorkplaceStats) => (
                                <tr key={w.id}>
                                    <td>{w.name}</td>
                                    <td>{w.patient_count}</td>
                                    <td>{w.consultation_count}</td>
                                    <td>{w.procedure_count}</td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={4}>Aucune clinique trouvée correspondant à la recherche.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </section>
    );

    // --- Rendu des Statistiques par Médecin ---
    const renderDoctorStats = () => (
        <section className="stats-section">
            <h2>Statistiques par Médecin</h2>
            <div className="stats-table-container">
                <table className="stats-table">
                    <thead>
                        <tr>
                            <th onClick={() => requestSort('full_name', 'doctor')}>
                                Médecin {getSortIcon('full_name', doctorSortConfig)}
                            </th>
                            <th onClick={() => requestSort('specialty', 'doctor')}>
                                Spécialité {getSortIcon('specialty', doctorSortConfig)}
                            </th>
                            <th onClick={() => requestSort('patient_count', 'doctor')}>
                                Patients assignés {getSortIcon('patient_count', doctorSortConfig)}
                            </th>
                            <th onClick={() => requestSort('consultation_count', 'doctor')}>
                                Consultations {getSortIcon('consultation_count', doctorSortConfig)}
                            </th>
                            <th onClick={() => requestSort('referral_count', 'doctor')}>
                                Références faites {getSortIcon('referral_count', doctorSortConfig)}
                            </th>
                            <th onClick={() => requestSort('procedure_count', 'doctor')}>
                                Actes effectués {getSortIcon('procedure_count', doctorSortConfig)}
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredAndSortedDoctors.length > 0 ? (
                            filteredAndSortedDoctors.map((d: DoctorStats) => (
                                <tr key={d.id}>
                                    {/* UTILISATION DE full_name POUR AFFICHER LE NOM COMPLET */}
                                    <td>Dr. {d.full_name}</td> 
                                    <td>{d.specialty}</td>
                                    <td>{d.patient_count}</td>
                                    <td>{d.consultation_count}</td>
                                    <td>{d.referral_count}</td>
                                    <td>{d.procedure_count}</td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={6}>Aucun médecin trouvé correspondant à la recherche.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </section>
    );
    
    // --- Rendu des Totaux Globaux ---
    const renderGlobalTotals = () => (
        <section className="stats-section global-totals">
            <h2>Totaux Globaux de la Plateforme</h2>
            <div className="stats-grid">
                <div className="stat-card">
                    <h3>Médecins</h3>
                    <p className="stat-number">{stats.total_doctors}</p>
                </div>
                <div className="stat-card">
                    <h3>Cliniques</h3>
                    <p className="stat-number">{stats.total_workplaces}</p>
                </div>
                <div className="stat-card">
                    <h3>Patients</h3>
                    <p className="stat-number">{stats.total_patients}</p>
                </div>
                <div className="stat-card">
                    <h3>Consultations</h3>
                    <p className="stat-number">{stats.total_consultations}</p>
                </div>
                <div className="stat-card">
                    <h3>Références</h3>
                    <p className="stat-number">{stats.total_referrals}</p>
                </div>
                <div className="stat-card">
                    <h3>Actes Médicaux</h3>
                    <p className="stat-number">{stats.total_procedures}</p>
                </div>
            </div>
        </section>
    );

    return (
        <div className="stats-container">
            <header className="stats-header">
                <h1>Statistiques Globales de l'Application 📊</h1>
            </header>
            <main className="stats-content">
                {renderGlobalTotals()}
                
                {/* CONTRÔLES DE RECHERCHE */}
                {renderControls()} 
                
                {renderWorkplaceStats()}
                {renderDoctorStats()}
            </main>
        </div>
    );
}

export default Statistics_Globale;