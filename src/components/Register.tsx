import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './Auth.css';

const API_BASE_URL = 'http://127.0.0.1:8000/api';

const Register = () => {
    // 1. État pour le code d'enregistrement initial
    const [registrationCode, setRegistrationCode] = useState('');
    
    // 2. État pour déterminer si le code a été saisi (pour afficher le formulaire complet)
    const [codeEntered, setCodeEntered] = useState(false); 

    // 3. État pour les données du formulaire (inclut le code pour la soumission finale)
    const [formData, setFormData] = useState({
        first_name: '', 
        last_name: '',  
        email: '',
        password: '',
        license_number: '',
        specialty: '', // IMPORTANT : maintiens ce champ ici
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const navigate = useNavigate();

    // Gestion des changements pour le formulaire complet
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prevData => ({
            ...prevData,
            [name]: value
        }));
    };
    
    // Logique de validation locale du code (simple vérification de longueur)
    const handleCodeSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        // Une simple vérification locale avant d'afficher le formulaire
        if (registrationCode.trim().length >= 10) { 
            setCodeEntered(true);
            setSuccess('Code saisi. Veuillez compléter le formulaire.');
        } else {
            setError('Veuillez entrer un code d\'enregistrement valide (min. 10 caractères).');
        }
    };

    // Soumission du formulaire complet au backend
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);
        setLoading(true);

        // Assembler les données finales (avec le code)
        const finalData = {
            ...formData,
            registration_code: registrationCode, // AJOUT du code à la soumission
        };

        try {
            const endpoint = `${API_BASE_URL}/register/doctor/`;
            const response = await axios.post(endpoint, finalData);

            if (response.status === 201) {
                setSuccess('Inscription réussie ! Redirection vers la connexion...');
                setTimeout(() => {
                    navigate('/login', { replace: true });
                }, 2000); 
            }
        } catch (err) {
            if (axios.isAxiosError(err) && err.response) {
                const errorData = err.response.data;
                
                // Gestion des erreurs par champ
                let errorMessage = 'Erreur lors de l\'inscription.';
                if (typeof errorData === 'object' && errorData !== null) {
                    const errorMessages = Object.values(errorData).flat().join(' ');
                    errorMessage = `Erreur: ${errorMessages}`;
                }
                
                // Si l'erreur est spécifiquement liée au code
                if (errorData.registration_code) {
                    setError(`Code invalide ou déjà utilisé. ${errorData.registration_code[0]}.`);
                    setCodeEntered(false); // Revenir à l'étape du code
                    setRegistrationCode('');
                } else {
                    setError(errorMessage);
                }
            } else {
                setError('Une erreur réseau est survenue.');
            }
        } finally {
            setLoading(false);
        }
    };

    // --- Rendu du composant ---

    if (!codeEntered) {
        // AFFICHAGE DU POP-UP / FORMULAIRE DE CODE SEUL
        return (
            <div className="auth-container">
                <form onSubmit={handleCodeSubmit} className="auth-form auth-modal">
                    <h2>Code d'Accès Requis 🔑</h2>
                    <p>Veuillez entrer le code d'enregistrement fourni par l'administrateur pour continuer.</p>
                    
                    {error && <p className="error-message">{error}</p>}
                    
                    <div className="form-group">
                        <label htmlFor="registrationCode">Code d'Enregistrement</label>
                        <input
                            type="text"
                            id="registrationCode"
                            name="registrationCode"
                            value={registrationCode}
                            onChange={(e) => setRegistrationCode(e.target.value)}
                            required
                            placeholder="Entrez le code UUID"
                        />
                    </div>
                    
                    <button type="submit">
                        Vérifier le code
                    </button>
                </form>
            </div>
        );
    }

    // AFFICHAGE DU FORMULAIRE D'INSCRIPTION COMPLET
    return (
        <div className="auth-container">
            <form onSubmit={handleSubmit} className="auth-form">
                <h2>Inscription du Docteur</h2>
                {success && <p className="success-message">{success}</p>}
                {error && <p className="error-message">{error}</p>}
                
                {/* Champ du code d'enregistrement: caché mais inclus pour la soumission finale. */}
                <input type="hidden" name="registration_code" value={registrationCode} />

                {/* --- Champs du formulaire --- */}
                <div className="form-group">
                    <label htmlFor="first_name">Prénom</label>
                    <input
                        type="text" id="first_name" name="first_name" value={formData.first_name}
                        onChange={handleChange} required
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="last_name">Nom</label>
                    <input
                        type="text" id="last_name" name="last_name" value={formData.last_name}
                        onChange={handleChange} required
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="email">Email</label>
                    <input
                        type="email" id="email" name="email" value={formData.email}
                        onChange={handleChange} required
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="license_number">Numéro de licence</label>
                    <input
                        type="text" id="license_number" name="license_number" value={formData.license_number}
                        onChange={handleChange} required
                    />
                </div>
                {/* Ajout du champ specialty (même s'il est vide) pour éviter l'erreur "field may not be blank" côté DRF */}
                <div className="form-group">
                    <label htmlFor="specialty">Spécialité (Optionnel)</label>
                    <input
                        type="text" 
                        id="specialty" 
                        name="specialty" 
                        value={formData.specialty}
                        onChange={handleChange} 
                    />
                </div>
                
                <div className="form-group">
                    <label htmlFor="password">Mot de passe</label>
                    <input
                        type="password" id="password" name="password" value={formData.password}
                        onChange={handleChange} required
                    />
                </div>
                
                <button type="submit" disabled={loading}>
                    {loading ? 'Inscription en cours...' : 'Terminer l\'inscription'}
                </button>
                <p className="link-back" onClick={() => setCodeEntered(false)}>
                    Revenir à la saisie du code
                </p>
            </form>
        </div>
    );
};

export default Register;