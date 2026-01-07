// Fichier : src/config.tsx

/**
 * URL de base de l'API Django. 
 * Vite définit 'import.meta.env.PROD' à 'true' lors du 'npm run build'
 */
export const BASE_URL = import.meta.env.PROD 
    ? 'https://backend-django-el3o.onrender.com' 
    : 'http://127.0.0.1:8000';

export const API_ENDPOINTS = {
    LOGIN: `${BASE_URL}/api/token/`,
    REFRESH: `${BASE_URL}/api/token/refresh/`,
    REGISTER: `${BASE_URL}/api/register/`,
};