// Fichier : src/components/Dashboard.tsx

//import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import './Dashboard.css';

function Dashboard() {
    const { user } = useAuth();

    return (
        <div className="dashboard-container">
            <header className="dashboard-header">
                <h1>Tableau de bord</h1>
            </header>
            <main className="dashboard-content">
                <h2>Bienvenue, Dr. {user?.full_name || 'Utilisateur'} dans votre gestionnaire de dossiers médicaux.</h2>
                <p>Accédez à vos patients, rendez-vous, et plus encore via la navigation.</p>
                <nav className="dashboard-nav">
                    <Link to="/patients" className="nav-button">Mes Patients</Link>
                    <Link to="/referrals" className="nav-button">Toutes les Références</Link>
                    
                    {/* Lien vers les statistiques de l'utilisateur (Statistics.tsx) */}
                    <Link to="/my-stats" className="nav-button">Mes Statistiques</Link> 

                    {/* Lien vers les statistiques GLOBALEs (Statistics_Globale.tsx) */}
                    <Link to="/global-stats" className="nav-button primary-button">Statistiques Globales 🌎</Link> 
                </nav>
            </main>
        </div>
    );
}

export default Dashboard;