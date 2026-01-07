// Fichier : src/App.tsx

import { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/Header';
import Register from './components/Register';
// ⚠️ ATTENTION : Login est désormais inclus dans Home
// import Login from './components/Login'; 
import Home from './components/LandingPage.tsx'; // 💡 Import du NOUVEAU composant Home/LandingPage
import Dashboard from './components/Dashboard';
import Patients from './components/Patients';
import PatientDetail from './components/PatientDetail';
import AddPatient from './components/AddPatient';
import EditPatient from './components/EditPatientPage';
import Appointments from './components/Appointments';
import DeletedAppointments from './components/DeletedAppointments';
import Notes from './components/Notes';
import ClinicList from './components/Clinics';
import ClinicDetail from './components/ClinicDetail';
import ClinicForm from './components/ClinicForm';
import Forum from './components/Forum';
import Profile from './components/Profile';
import EditProfile from './components/EditProfile';
import PrivateRoutes from './utils/PrivateRoutes';
import { useAuth } from './hooks/useAuth';
import ReferralsList from './components/ReferralsList';
import Statistics from './components/Statistics';
import Statistics_Globale from './components/Statistics_Globale';
import './App.css';

function App() {
    const { isAuthenticated, authIsLoading } = useAuth();
    const [refreshPatients, setRefreshPatients] = useState(false);

    const handlePatientAdded = () => {
        setRefreshPatients(prev => !prev);
    };

    if (authIsLoading) {
        return <div>Chargement de l'application...</div>;
    }

    return (
        <div className="App">
            {isAuthenticated && <Header />}
            
            <Routes>
                {/* 1. Page d'inscription (reste séparée) */}
                <Route path="/register" element={<Register />} />
                
                {/* 2. Page d'Accueil/Connexion (utilise le nouveau composant Home) */}
                <Route path="/login" element={<Home />} />
                
                {/* Routes protégées par PrivateRoutes */}
                <Route element={<PrivateRoutes />}>
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/patients" element={<Patients refreshPatients={refreshPatients} />} />
                    <Route path="/patients/:id" element={<PatientDetail />} />
                    <Route path="/patients/add" element={<AddPatient onPatientAdded={handlePatientAdded} />} />
                    <Route path="/patients/edit/:id" element={<EditPatient />} />
                    <Route path="/appointments" element={<Appointments />} />
                    <Route path="/deleted-appointments" element={<DeletedAppointments />} />
                    <Route path="/notes" element={<Notes />} />
                    
                    <Route path="/referrals" element={<ReferralsList />} />

                    <Route path="/clinics" element={<ClinicList />} />
                    <Route path="/clinics/add" element={<ClinicForm />} />
                    <Route path="/clinics/edit/:id" element={<ClinicForm />} />
                    <Route path="/clinics/:id" element={<ClinicDetail />} />
                    
                    <Route path="/forum" element={<Forum />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/edit-profile" element={<EditProfile />} />
                    
                    <Route path="/my-stats" element={<Statistics />} />
                    <Route path="/global-stats" element={<Statistics_Globale />} />
                    
                </Route>
                
                {/* Redirection par défaut : 
                    - Si connecté, vers /dashboard
                    - Si déconnecté, vers /login (qui affiche la LandingPage) */}
                <Route path="/" element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />} />
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </div>
    );
}

export default App;