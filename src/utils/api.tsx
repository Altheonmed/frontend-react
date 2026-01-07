// Fichier : src/utils/api.ts

import axios, { type AxiosRequestConfig, type AxiosResponse } from 'axios';

// IMPORTANT: Remplacer BASE_URL par l'URL utilisée dans AuthContext si elle est différente
// Dans votre AuthContext, c'était 'http://127.0.0.1:8000/api', donc nous allons utiliser celle-là.
const API_BASE_URL = 'http://127.0.0.1:8000/api'; 
// Si vous aviez un BASE_URL séparé pour la racine, vous pourriez utiliser :
// const BASE_URL = 'http://127.0.0.1:8000'; 
// Pour cet exemple, nous allons utiliser l'URL complète de l'API.


/**
 * Récupère le jeton d'accès actuel depuis le localStorage.
 * CORRECTION: Lit la clé 'token', pas 'authTokens'.
 * @returns Le jeton d'accès ou null.
 */
const getAccessToken = (): string | null => {
    // La clé 'token' est celle utilisée dans AuthContext.tsx
    return localStorage.getItem('token'); 
};

/**
 * Fonction d'aide pour effectuer des requêtes API protégées en utilisant Axios.
 * Elle se repose sur les intercepteurs Axios définis dans AuthContext pour l'ajout
 * automatique du jeton et la gestion du rafraîchissement/déconnexion (401/403).
 * * @param endpoint L'endpoint spécifique à appeler (ex: 'stats/global/').
 * @param config Les options de la requête Axios (méthode, corps, etc.).
 * @returns La réponse JSON de l'API (ou null pour 204).
 */
export async function fetchProtectedData<T = any>(endpoint: string, config: AxiosRequestConfig = {}): Promise<T> {
    const accessToken = getAccessToken();

    // Cette vérification lève l'erreur pour que Statistics_Globale.tsx appelle logout()
    if (!accessToken) {
        throw new Error("Jeton d'accès manquant. Veuillez vous reconnecter.");
    }

    // Si vous utilisez les intercepteurs dans AuthContext, VOUS NE DEVRIEZ PAS AVOIR
    // besoin de définir l'en-tête 'Authorization' ici, car l'intercepteur le fait.
    // Cependant, nous le laissons pour que le composant puisse fonctionner de manière 
    // autonome si l'intercepteur n'est pas encore actif.
    const defaultHeaders = {
        'Content-Type': 'application/json',
        // L'intercepteur dans AuthContext.tsx gère déjà ceci. 
        // Si vous le mettez ici, il sera potentiellement dupliqué.
        // Nous le laissons en commentaire pour privilégier l'intercepteur.
        // 'Authorization': `Bearer ${accessToken}`, 
    };

    const requestConfig: AxiosRequestConfig = {
        method: 'GET', // Valeur par défaut
        url: `${API_BASE_URL}/${endpoint}`,
        ...config,
        headers: {
            ...defaultHeaders,
            ...config.headers, // Permet de surcharger les en-têtes
        },
    };

    try {
        const response: AxiosResponse<T> = await axios.request<T>(requestConfig);
        
        // Gérer les réponses 204 (No Content)
        if (response.status === 204) {
            return null as T;
        }
        
        return response.data;
    } catch (error) {
        // L'intercepteur de réponse dans AuthContext devrait gérer les 401/403.
        // Pour les autres erreurs, nous propageons l'erreur.
        throw error;
    }
}