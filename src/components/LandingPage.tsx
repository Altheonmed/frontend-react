// Fichier : src/components/LandingPage.tsx (ou Home.tsx)

import React from 'react';
import Login from '../components/Login';
import HomescreenHeader from '../components/HomescreenHeader';
import '../components/Auth.css'; // Pour le wrapper

const LandingPage: React.FC = () => {
    return (
        // Le wrapper principal pour centrer le contenu et définir l'arrière-plan
        <div className="auth-page-wrapper">
            
            {/* 1. L'en-tête visuel/branding */}
            <HomescreenHeader />

            {/* 2. Le formulaire de connexion */}
            <Login /> 

            {/* 3. Zone d'information ou de pied de page (optionnel) */}
            <footer style={{ marginTop: 'auto', padding: '10px', color: '#7f8c8d' }}>
                &copy; {new Date().getFullYear()} Altheon Medical Expertise. Tous droits réservés.
            </footer>
        </div>
    );
};

export default LandingPage;