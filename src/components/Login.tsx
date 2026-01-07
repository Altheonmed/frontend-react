import React, { useState } from 'react';
//import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import axios from 'axios';
import './Auth.css';

function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    //const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMessage('');
        setLoading(true);

        try {
            await login({ email, password });
        } catch (error) {
            if (axios.isAxiosError(error) && error.response) {
                const data = error.response.data;
                let message = 'Identifiants invalides. Veuillez réessayer.';
                
                if (data.message) { message = data.message; } 
                else if (data.detail) { message = data.detail; } 
                else if (data.non_field_errors) { message = data.non_field_errors[0]; }
                
                setErrorMessage(message);
            }
            // IMPORTANT : setLoading(false) est ici en cas d'échec
            setLoading(false); 
        }
        // NOTE: Si la connexion réussit, le composant est démonté par la navigation dans useAuth, 
        // donc nous n'avons pas besoin d'un 'finally' général.
    };

    return (
        <div className="auth-container">
            
            <h2 className="login-title">Connexion Médecin</h2>
            
            <form onSubmit={handleSubmit} className="auth-form">
                {errorMessage && <p className="error-message">{errorMessage}</p>}
                
                <div className="form-group">
                    <label htmlFor="email">Email professionnel</label>
                    <input
                        type="email"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        aria-label="Email professionnel"
                        disabled={loading} // 💡 Ajout pour l'UX
                    />
                </div>
                
                <div className="form-group">
                    <label htmlFor="password">Mot de passe</label>
                    <input
                        type="password"
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        aria-label="Mot de passe"
                        disabled={loading} // 💡 Ajout pour l'UX
                    />
                </div>
                
                <button type="submit" className="login-button" disabled={loading}>
                    {loading ? 'Connexion en cours...' : 'Se connecter'}
                </button>
            </form>

            <p className="register-link-text">
                Pas encore de compte ? <a href="/register">S'inscrire</a>
            </p>
        </div>
    );
}

export default Login;