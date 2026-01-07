import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom'; // useNavigate est utile pour la redirection
import axios from 'axios';
import { useAuth } from '../hooks/useAuth'; // Assurez-vous que ce chemin est correct
import { type PatientWithHistory, type Consultation, type MedicalProcedure, type Referral } from '../types'; // Assurez-vous que ces types sont correctement définis
import jsPDF from 'jspdf';
import './DetailStyles.css'; // Assurez-vous que ce fichier CSS existe et est correctement importé
import ConsultationForm from './ConsultationForm'; // Assurez-vous que ces composants existent et sont correctement importés
import MedicalProcedureForm from './MedicalProcedureForm';
import ReferralForm from './ReferralForm';

const PatientDetails = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate(); // Hook pour la navigation
    const { token, user, logout } = useAuth(); // Récupère le token, l'utilisateur et la fonction logout
    const [patient, setPatient] = useState<PatientWithHistory | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // États pour contrôler l'affichage des formulaires
    const [showConsultationForm, setShowConsultationForm] = useState(false);
    const [showProcedureForm, setShowProcedureForm] = useState(false);
    const [showReferralForm, setShowReferralForm] = useState(false);

    // États pour stocker les données à modifier
    const [consultationToEdit, setConsultationToEdit] = useState<Consultation | null>(null);
    const [procedureToEdit, setProcedureToEdit] = useState<MedicalProcedure | null>(null);
    const [referralToEdit, setReferralToEdit] = useState<Referral | null>(null);

    // État pour gérer l'ouverture/fermeture du menu d'actions
    const [showDropdown, setShowDropdown] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null); // Référence pour détecter les clics en dehors du menu

    // Effect pour récupérer les détails du patient au montage du composant ou si l'ID/token change
    useEffect(() => {
        if (id && token) {
            fetchPatientDetails();
        } else if (!token) {
            setError("Vous n'êtes pas authentifié. Veuillez vous connecter.");
            setLoading(false);
            // Rediriger vers la page de connexion si non authentifié
            navigate('/login'); // Assurez-vous que '/login' est votre route de connexion
        }
    }, [id, token, navigate]); // Ajouter navigate aux dépendances

    // Effect pour gérer la fermeture du menu déroulant lors d'un clic extérieur
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            // Vérifie si le clic est à l'extérieur du dropdown
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowDropdown(false);
            }
        };

        // Ajouter l'écouteur d'événement lorsque le menu est ouvert
        if (showDropdown) {
            document.addEventListener('mousedown', handleClickOutside);
        } else {
            document.removeEventListener('mousedown', handleClickOutside);
        }

        // Nettoyage : retirer l'écouteur d'événement lorsque le composant est démonté ou que le dropdown est fermé
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showDropdown]); // Ré-exécuter l'effect si showDropdown change

    const fetchPatientDetails = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await axios.get(`http://127.0.0.1:8000/api/patients/${id}/`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setPatient(response.data);
        } catch (err: any) { // Utiliser 'any' ou un type plus spécifique pour err
            console.error('Erreur lors de la récupération des détails du patient:', err);
            if (axios.isAxiosError(err) && err.response?.status === 401) {
                setError('Session expirée. Veuillez vous reconnecter.');
                logout(); // Déconnecter l'utilisateur
                navigate('/login'); // Rediriger vers la page de connexion
            } else if (axios.isAxiosError(err) && err.response?.status === 404) {
                setError('Patient non trouvé.');
                navigate('/patients'); // Rediriger vers la liste des patients si le patient n'existe pas
            } else {
                setError('Impossible de charger les détails du patient. Veuillez réessayer.');
            }
        } finally {
            setLoading(false);
        }
    };

    // Fonction appelée après une action réussie (ajout, modification, suppression)
    const handleSuccess = () => {
        // Fermer tous les formulaires et réinitialiser les états d'édition
        setShowConsultationForm(false);
        setShowProcedureForm(false);
        setShowReferralForm(false);
        setConsultationToEdit(null);
        setProcedureToEdit(null);
        setReferralToEdit(null);
        // Rafraîchir les données pour afficher les modifications
        fetchPatientDetails();
    };

    // Fonction appelée pour annuler une action (fermer un formulaire)
    const handleCancel = () => {
        setShowConsultationForm(false);
        setShowProcedureForm(false);
        setShowReferralForm(false);
        setConsultationToEdit(null);
        setProcedureToEdit(null);
        setReferralToEdit(null);
    };

    // Gestionnaires pour la suppression
    const handleDeleteConsultation = async (consultationId: number) => {
        if (!window.confirm("Êtes-vous sûr de vouloir supprimer cette consultation ? Cette action est irréversible. ⚠️")) return;
        try {
            await axios.delete(`http://127.0.0.1:8000/api/consultations/${consultationId}/`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            fetchPatientDetails(); // Rafraîchir la liste après suppression
        } catch (err: any) {
            console.error('Erreur lors de la suppression de la consultation:', err);
            setError('Une erreur est survenue lors de la suppression de la consultation.');
            if (axios.isAxiosError(err) && err.response?.status === 403) {
                setError('Vous n\'avez pas la permission de supprimer cette consultation.');
            }
        }
    };

    const handleDeleteProcedure = async (procedureId: number) => {
        if (!window.confirm("Êtes-vous sûr de vouloir supprimer cet acte médical ? Cette action est irréversible. ⚠️")) return;
        try {
            await axios.delete(`http://127.0.0.1:8000/api/medical-procedures/${procedureId}/`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            fetchPatientDetails(); // Rafraîchir la liste après suppression
        } catch (err: any) {
            console.error('Erreur lors de la suppression de l\'acte médical:', err);
            setError('Une erreur est survenue lors de la suppression de l\'acte médical.');
            if (axios.isAxiosError(err) && err.response?.status === 403) {
                setError('Vous n\'avez pas la permission de supprimer cet acte médical.');
            }
        }
    };

    const handleDeleteReferral = async (referralId: number) => {
        if (!window.confirm("Êtes-vous sûr de vouloir supprimer cette orientation ? Cette action est irréversible. ⚠️")) return;
        try {
            // Utilisation de l'URL générique pour la suppression d'une référence
            await axios.delete(`http://127.0.0.1:8000/api/referrals/${referralId}/`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            fetchPatientDetails(); // Rafraîchir la liste après suppression
        } catch (err: any) {
            console.error("Erreur lors de la suppression de l'orientation:", err);
            setError("Une erreur est survenue lors de la suppression de l'orientation.");
            if (axios.isAxiosError(err) && err.response?.status === 403) {
                setError('Vous n\'avez pas la permission de supprimer cette orientation.');
            }
        }
    };

    // Gestionnaires pour la modification (pré-remplissage des formulaires)
    const handleEditConsultation = (consultation: Consultation) => {
        setConsultationToEdit(consultation);
        setShowConsultationForm(true);
        // Fermer les autres formulaires si ouverts
        setShowProcedureForm(false);
        setShowReferralForm(false);
        setShowDropdown(false); // Fermer le menu d'actions
    };

    const handleEditProcedure = (procedure: MedicalProcedure) => {
        setProcedureToEdit(procedure);
        setShowProcedureForm(true);
        // Fermer les autres formulaires si ouverts
        setShowConsultationForm(false);
        setShowReferralForm(false);
        setShowDropdown(false); // Fermer le menu d'actions
    };

    const handleEditReferral = (referral: Referral) => {
        setReferralToEdit(referral);
        setShowReferralForm(true);
        // Fermer les autres formulaires si ouverts
        setShowConsultationForm(false);
        setShowProcedureForm(false);
        setShowDropdown(false); // Fermer le menu d'actions
    };

    // Fonction pour exporter le dossier patient en PDF
    const handleExportPdf = async () => {
        if (!patient || !user) {
            setError("Informations du patient ou du médecin manquantes pour l'exportation.");
            return;
        }

        const doc = new jsPDF();
        let y = 10; // Position verticale initiale

        // Fonctions utilitaires pour l'ajout de texte et de titres dans le PDF
        const addText = (text: string, x: number, yPos: number, size: number, style: 'normal' | 'bold' = 'normal') => {
            doc.setFontSize(size);
            doc.setFont('helvetica', style);
            doc.text(text, x, yPos);
        };

        const addSectionTitle = (title: string, yPos: number) => {
            const newY = yPos + 5;
            addText(title, 10, newY, 16, 'bold');
            doc.line(10, newY + 2, 200, newY + 2); // Ligne de séparation sous le titre
            return newY + 10; // Retourne la nouvelle position Y après le titre et la ligne
        };

        // Ajout des informations principales du patient
        y = addSectionTitle(`Dossier Patient - ${patient.first_name} ${patient.last_name}`, y);
        addText(`Date de création du dossier: ${new Date().toLocaleDateString()}`, 10, y, 10, 'normal'); // Ajout date création dossier
        y += 10;
        addText(`Médecin traitant: Dr. ${user.full_name || 'Inconnu'}`, 10, y, 12, 'normal');
        y += 15;

        // Section : Informations personnelles et antécédents
        y = addSectionTitle('Informations personnelles et antécédents', y);
        addText(`Date de naissance: ${patient.date_of_birth || 'Non spécifiée'}`, 10, y, 12, 'normal');
        y += 7;
        addText(`Âge: ${patient.age || 'Non spécifié'}`, 10, y, 12, 'normal');
        y += 7;
        addText(`Groupe sanguin: ${patient.blood_group || 'Non spécifié'}`, 10, y, 12, 'normal');
        y += 7;
        addText(`Adresse: ${patient.address || 'Non spécifiée'}`, 10, y, 12, 'normal');
        y += 7;
        addText(`Email: ${patient.email || 'Non spécifié'}`, 10, y, 12, 'normal');
        y += 7;
        addText(`Téléphone: ${patient.phone_number || 'Non spécifié'}`, 10, y, 12, 'normal');
        y += 7;
        addText(`Allergies: ${patient.allergies || 'Non spécifiées'}`, 10, y, 12, 'normal');
        y += 10;

        addText(`Antécédents médicaux:`, 10, y, 12, 'bold');
        y += 5;
        // Gestion du texte long pour les antécédents
        const historyLines = doc.splitTextToSize(patient.medical_history || 'Aucun antécédent médical enregistré.', 190);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.text(historyLines.join('\n'), 10, y);
        y += historyLines.length * 7 + 10; // Ajustement de la position Y après le texte

        // Section : Historique des consultations
        if (patient.consultations && patient.consultations.length > 0) {
            y = addSectionTitle('Historique des consultations', y);
            patient.consultations.forEach((c) => {
                // Gestion du passage à la page suivante si le contenu dépasse la limite
                if (y > 270) { // Seuil pour passer à la page suivante (ajustable)
                    doc.addPage();
                    y = 20; // Nouvelle position Y au début de la page
                }
                addText(`Consultation du ${new Date(c.consultation_date).toLocaleDateString()}`, 10, y, 12, 'bold');
                y += 7;
                addText(`Motif: ${c.reason_for_consultation}`, 10, y, 12, 'normal');
                y += 7;
                if (c.diagnosis) {
                    addText(`Diagnostic: ${c.diagnosis}`, 10, y, 12, 'normal');
                    y += 7;
                }
                if (c.medications) {
                    addText(`Médicaments: ${c.medications}`, 10, y, 12, 'normal');
                    y += 7;
                }
                if (c.medical_report) {
                    const reportLines = doc.splitTextToSize(`Rapport: ${c.medical_report}`, 190);
                    doc.setFontSize(12);
                    doc.setFont('helvetica', 'normal');
                    doc.text(reportLines.join('\n'), 10, y);
                    y += reportLines.length * 7;
                }
                y += 5; // Espace entre les entrées de consultation
            });
        }

        // Section : Historique des actes médicaux
        if (patient.medical_procedures && patient.medical_procedures.length > 0) {
            y = addSectionTitle('Historique des actes médicaux', y);
            patient.medical_procedures.forEach((p) => {
                if (y > 270) {
                    doc.addPage();
                    y = 20;
                }
                addText(`${p.procedure_type} - ${new Date(p.procedure_date).toLocaleDateString()}`, 10, y, 12, 'bold');
                y += 7;
                if (p.result) {
                    addText(`Résultat: ${p.result}`, 10, y, 12, 'normal');
                    y += 7;
                }
                // Ici, nous ajouterons une mention pour les pièces jointes, mais pas le téléchargement direct dans le PDF.
                if (p.attachments) {
                    addText('Pièces jointes disponibles (voir accès en ligne)', 10, y, 11, 'normal');
                    y += 7;
                }
                y += 5; // Espace entre les entrées d'actes médicaux
            });
        }

        // Section : Historique des orientations
        if (patient.referrals && patient.referrals.length > 0) {
            y = addSectionTitle('Historique des orientations', y);
            patient.referrals.forEach((r) => {
                if (y > 270) {
                    doc.addPage();
                    y = 20;
                }
                addText(`Orientation du ${new Date(r.date_of_referral).toLocaleDateString()}`, 10, y, 12, 'bold');
                y += 7;
                // Utilisation des détails imbriqués fournis par le serializer
                addText(`Orientation vers: ${r.referred_to_details?.full_name || r.referred_to || 'Inconnu'}`, 10, y, 12, 'normal');
                y += 7;
                addText(`Référencé par: ${r.referred_by_details?.full_name || r.referred_by || 'Inconnu'}`, 10, y, 12, 'normal');
                y += 7;
                addText(`Motif: ${r.reason_for_referral}`, 10, y, 12, 'normal');
                y += 7;
                if (r.specialty_requested) {
                    addText(`Spécialité demandée: ${r.specialty_requested}`, 10, y, 12, 'normal');
                    y += 7;
                }
                if (r.comments) {
                    const commentLines = doc.splitTextToSize(`Commentaires: ${r.comments}`, 190);
                    doc.setFontSize(12);
                    doc.setFont('helvetica', 'normal');
                    doc.text(commentLines.join('\n'), 10, y);
                    y += commentLines.length * 7;
                }
                y += 5; // Espace entre les entrées d'orientations
            });
        }

        const fileName = `${patient.first_name}_${patient.last_name}_dossier_${new Date().toISOString().slice(0, 10)}.pdf`;
        doc.save(fileName); // Sauvegarde le fichier PDF
    };

    /**
     * Fonction pour gérer le téléchargement de pièces jointes des actes médicaux.
     * @param attachmentUrl L'URL complète du fichier à télécharger.
     * @param attachmentName Le nom souhaité pour le fichier téléchargé.
     */
    const downloadFile = async (attachmentUrl: string | null | undefined, attachmentName?: string) => {
        if (!attachmentUrl) {
            alert("Aucun fichier n'est disponible pour le téléchargement. 🚫");
            return;
        }
        // Extraire le nom de fichier de l'URL s'il n'est pas fourni ou est générique
        let fileNameToUse = attachmentName || 'attachment';
        if (!attachmentName && attachmentUrl.includes('/')) {
            const urlParts = attachmentUrl.split('/');
            fileNameToUse = urlParts[urlParts.length - 1] || 'attachment';
        }

        try {
            const response = await axios({
                method: 'get',
                // Utiliser directement l'URL complète car elle provient de l'API
                url: attachmentUrl,
                responseType: 'blob', // Indique que la réponse attendue est un fichier binaire (Blob)
                headers: {
                    Authorization: `Bearer ${token}`, // Assurez-vous que le token d'authentification est bien envoyé
                },
            });

            // Créer un objet Blob à partir des données reçues
            const blob = new Blob([response.data]);
            // Créer une URL temporaire pour le Blob
            const url = window.URL.createObjectURL(blob);

            // Créer un élément 'a' (lien) pour déclencher le téléchargement
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', fileNameToUse); // Nom du fichier à télécharger
            document.body.appendChild(link);
            link.click(); // Simuler un clic sur le lien pour lancer le téléchargement

            // Nettoyage : révoquer l'URL temporaire et supprimer le lien créé
            window.URL.revokeObjectURL(url);
            document.body.removeChild(link);

            console.log("Fichier téléchargé avec succès ! ✅");

        } catch (error: any) {
            console.error('Erreur lors du téléchargement du fichier:', error);
            let errorMessage = 'Une erreur est survenue lors du téléchargement du fichier.';
            if (axios.isAxiosError(error) && error.response?.status === 403) {
                errorMessage = 'Vous n\'avez pas la permission de télécharger ce fichier.';
            } else if (axios.isAxiosError(error) && error.response?.status === 404) {
                errorMessage = 'Le fichier demandé n\'a pas été trouvé.';
            }
            alert(`${errorMessage} Veuillez vérifier votre connexion ou réessayer plus tard. 😥`);
        }
    };

    // Affichage conditionnel basé sur les états de chargement, d'erreur ou de données manquantes
    if (loading) {
        return <div className="loading-message">Chargement des détails du patient... ⏳</div>;
    }
    if (error) {
        return <div className="error-message">Erreur : {error} ❌</div>;
    }
    if (!patient) {
        // Ce cas ne devrait idéalement pas arriver si l'ID est valide et qu'il n'y a pas d'erreur,
        // mais c'est une bonne sécurité.
        return <div className="no-data-message">Impossible de charger les données du patient. 🤷</div>;
    }

    // Rendu principal du composant
    return (
        <div className="patient-details-container detail-container">
            <div className="patient-info-header detail-header">
                <h2 className="patient-name">Dossier de: {patient.first_name} {patient.last_name}</h2>
                <div className="patient-actions">
                    <div className="dropdown" ref={dropdownRef}>
                        {/* Bouton pour ouvrir/fermer le menu déroulant */}
                        <button onClick={() => setShowDropdown(!showDropdown)} className="action-button dropdown-toggle">
                            Actions 🔽
                        </button>
                        {/* Menu déroulant affiché conditionnellement */}
                        {showDropdown && (
                            <ul className="dropdown-menu">
                                {/* Boutons pour ouvrir les formulaires d'ajout */}
                                <li>
                                    <button onClick={() => {
                                        setShowConsultationForm(true);
                                        setShowProcedureForm(false);
                                        setShowReferralForm(false);
                                        setConsultationToEdit(null); // Assure qu'aucun élément n'est en mode édition
                                        setShowDropdown(false);
                                    }} className="action-button dropdown-item">
                                        ➕ Ajouter une consultation
                                    </button>
                                </li>
                                <li>
                                    <button onClick={() => {
                                        setShowProcedureForm(true);
                                        setShowConsultationForm(false);
                                        setShowReferralForm(false);
                                        setProcedureToEdit(null);
                                        setShowDropdown(false);
                                    }} className="action-button dropdown-item">
                                        ➕ Ajouter un acte médical
                                    </button>
                                </li>
                                <li>
                                    <button onClick={() => {
                                        setShowReferralForm(true);
                                        setShowConsultationForm(false);
                                        setShowProcedureForm(false);
                                        setReferralToEdit(null);
                                        setShowDropdown(false);
                                    }} className="action-button dropdown-item">
                                        ➕ Ajouter une orientation
                                    </button>
                                </li>
                                {/* Bouton pour exporter le dossier */}
                                <li>
                                    <button onClick={() => { handleExportPdf(); setShowDropdown(false); }} className="action-button dropdown-item">
                                        📄 Exporter le dossier
                                    </button>
                                </li>
                            </ul>
                        )}
                    </div>
                </div>
            </div>

            {/* Conditionnellement afficher les formulaires d'ajout/modification */}
            {showConsultationForm && (
                <ConsultationForm patientId={id!} onSuccess={handleSuccess} onCancel={handleCancel} consultationToEdit={consultationToEdit} />
            )}
            {showProcedureForm && (
                <MedicalProcedureForm patientId={id!} onSuccess={handleSuccess} onCancel={handleCancel} procedureToEdit={procedureToEdit} />
            )}
            {showReferralForm && (
                <ReferralForm patientId={id!} onSuccess={handleSuccess} onClose={handleCancel} referralToEdit={referralToEdit} />
            )}

            <div id="patient-details-content">
                {/* Section : Informations Personnelles et Antécédents */}
                <div className="patient-details-card detail-info-group">
                    <h3>Informations personnelles et antécédents</h3>
                    <div className="info-item"><strong>ID Patient:</strong> {patient.unique_id || id}</div> {/* Utiliser unique_id si disponible */}
                    <div className="info-item"><strong>Date de naissance:</strong> {patient.date_of_birth ? new Date(patient.date_of_birth).toLocaleDateString() : 'Non spécifiée'}</div>
                    <div className="info-item"><strong>Âge:</strong> {patient.age || 'Non spécifié'}</div>
                    <div className="info-item"><strong>Groupe sanguin:</strong> {patient.blood_group || 'Non spécifié'}</div>
                    <div className="info-item"><strong>Adresse:</strong> {patient.address || 'Non spécifiée'}</div>
                    <div className="info-item"><strong>Email:</strong> {patient.email || 'Non spécifié'}</div>
                    <div className="info-item"><strong>Téléphone:</strong> {patient.phone_number || 'Non spécifié'}</div>
                    <div className="info-item"><strong>Allergies:</strong> {patient.allergies || 'Non spécifiées'}</div>
                    <hr />
                    <h3>Antécédents médicaux</h3>
                    <p className="info-item">{patient.medical_history || 'Aucun antécédent médical enregistré.'}</p>
                </div>

                {/* Section : Historique des Consultations */}
                <div className="patient-details-card detail-info-group">
                    <h3>Historique des consultations</h3>
                    {patient.consultations && patient.consultations.length > 0 ? (
                        <ul className="detail-list">
                            {patient.consultations.map((c) => (
                                <li key={c.id} className="consultation-entry detail-list-item">
                                    <h4>Consultation du {new Date(c.consultation_date).toLocaleDateString()}</h4>
                                    <div className="info-item"><strong>Motif:</strong> {c.reason_for_consultation}</div>
                                    {c.diagnosis && <div className="info-item"><strong>Diagnostic:</strong> {c.diagnosis}</div>}
                                    {c.medications && <div className="info-item"><strong>Médicaments:</strong> {c.medications}</div>}
                                    <div className="info-item"><strong>Rapport:</strong> {c.medical_report || 'Non renseigné'}</div>
                                    {c.weight && <div className="info-item"><strong>Poids:</strong> {c.weight} kg</div>}
                                    {c.height && <div className="info-item"><strong>Taille:</strong> {c.height} m</div>}
                                    {c.temperature && <div className="info-item"><strong>Température:</strong> {c.temperature} °C</div>}
                                    {c.blood_pressure && <div className="info-item"><strong>Tension:</strong> {c.blood_pressure}</div>}
                                    <div className="entry-actions">
                                        <button onClick={() => handleEditConsultation(c)} className="edit-button action-button">
                                            Modifier ✏️
                                        </button>
                                        <button onClick={() => handleDeleteConsultation(c.id)} className="delete-button action-button">
                                            Supprimer 🗑️
                                        </button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p>Aucune consultation enregistrée pour ce patient. 🤔</p>
                    )}
                </div>

                {/* Section : Historique des Actes Médicaux */}
                <div className="patient-details-card detail-info-group">
                    <h3>Historique des actes médicaux</h3>
                    {patient.medical_procedures && patient.medical_procedures.length > 0 ? (
                        <ul className="detail-list">
                            {patient.medical_procedures.map((p) => (
                                <li key={p.id} className="procedure-entry detail-list-item">
                                    <h4>{p.procedure_type} - {new Date(p.procedure_date).toLocaleDateString()}</h4>
                                    {p.result && <div className="info-item"><strong>Résultat:</strong> {p.result}</div>}
                                    {/* Conditionnelle pour vérifier si p.attachments existe avant d'afficher le bloc */}
                                    {p.attachments && (
                                        <div className="attachment-section">
                                            <strong>Pièces jointes:</strong>
                                            {/* Appel de la fonction downloadFile pour télécharger la pièce jointe */}
                                            <button 
                                                onClick={() => 
                                                    downloadFile(
                                                        p.attachments, 
                                                        // Utilisation de l'opérateur de chaînage optionnel (?) pour éviter l'erreur TS18047
                                                        `acte_medical_${p.id}_${p.attachments?.split('/').pop() || 'attachment'}`
                                                    )
                                                } 
                                                className="download-link"
                                            >
                                                Télécharger ⬇️
                                            </button>
                                        </div>
                                    )}
                                    <div className="entry-actions">
                                        <button onClick={() => handleEditProcedure(p)} className="edit-button action-button">
                                            Modifier ✏️
                                        </button>
                                        <button onClick={() => handleDeleteProcedure(p.id)} className="delete-button action-button">
                                            Supprimer 🗑️
                                        </button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p>Aucun acte médical enregistré pour ce patient. 🤷</p>
                    )}
                </div>

                {/* Section : Historique des Orientations */}
                <div className="patient-details-card detail-info-group">
                    <h3>Historique des orientations</h3>
                    {patient.referrals && patient.referrals.length > 0 ? (
                        <ul className="detail-list">
                            {patient.referrals.map((r) => (
                                <li key={r.id} className="referral-entry detail-list-item">
                                    <h4>Orientation du {new Date(r.date_of_referral).toLocaleDateString()}</h4>
                                    <div className="info-item"><strong>Orientation vers:</strong> {r.referred_to_details?.full_name || r.referred_to || 'Inconnu'}</div>
                                    <div className="info-item"><strong>Motif:</strong> {r.reason_for_referral}</div>
                                    <div className="info-item"><strong>Spécialité demandée:</strong> {r.specialty_requested || 'Non spécifiée'}</div>
                                    <div className="info-item"><strong>Référencé par:</strong> {r.referred_by_details?.full_name || r.referred_by || 'Inconnu'}</div>
                                    {r.comments && <div className="info-item"><strong>Commentaires:</strong> {r.comments}</div>}
                                    <div className="entry-actions">
                                        <button onClick={() => handleEditReferral(r)} className="edit-button action-button">
                                            Modifier ✏️
                                        </button>
                                        <button onClick={() => handleDeleteReferral(r.id)} className="delete-button action-button">
                                            Supprimer 🗑️
                                        </button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p>Aucune orientation enregistrée pour ce patient. 🧐</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PatientDetails;