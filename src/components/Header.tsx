// Fichier : src/components/Header.tsx
//import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth'; // Correction du chemin d'import
import './Header.css';

const Header = () => {
    const { isAuthenticated, user, profile, logout } = useAuth();

    return (
        <header className="main-header">
            <nav className="main-nav">
                <div className="nav-links">
                    <NavLink to="/dashboard" className="nav-logo">
                        Altheon Connect
                    </NavLink>
                    {isAuthenticated && (
                        <>
                            <NavLink to="/dashboard" className="nav-item">Tableau de bord</NavLink>
                            <NavLink to="/patients" className="nav-item">Patients</NavLink>
                            <NavLink to="/appointments" className="nav-item">Rendez-vous</NavLink>
                            <NavLink to="/notes" className="nav-item">Notes</NavLink>
                            <NavLink to="/clinics" className="nav-item">Cliniques</NavLink>
                            <NavLink to="/forum" className="nav-item">Forum</NavLink>
                        </>
                    )}
                </div>
                <div className="auth-links">
                    {isAuthenticated ? (
                        <>
                            <NavLink to="/profile" className="nav-item">Mon Profil</NavLink>
                            <div className="user-info-container">
                                <span className="user-name">
                                    Dr. {user?.full_name}
                                </span>
                                {profile?.specialty && (
                                    <span className="user-specialty">
                                        {profile.specialty}
                                    </span>
                                )}
                            </div>
                            <button onClick={logout} className="logout-button">Déconnexion</button>
                        </>
                    ) : (
                        <>
                            <NavLink to="/login" className="nav-item">Se connecter</NavLink>
                            <NavLink to="/register" className="nav-item">S'inscrire</NavLink>
                        </>
                    )}
                </div>
            </nav>
        </header>
    );
};

export default Header;