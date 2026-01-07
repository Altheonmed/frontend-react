import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../hooks/useAuth';
import './DetailStyles.css'; // Gardez l'import pour les styles de boutons
import './TextStyles.css'; // Importez le nouveau fichier de styles pour le texte

interface Note {
    id: number;
    title: string;
    content: string;
    created_at: string;
}

const API_BASE_URL = 'http://127.0.0.1:8000/api';

const Notes = () => {
    const { token } = useAuth();
    const [notes, setNotes] = useState<Note[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [editingNote, setEditingNote] = useState<Note | null>(null);
    const [formData, setFormData] = useState({ title: '', content: '' });

    useEffect(() => {
        fetchNotes();
    }, []);

    const fetchNotes = async () => {
        if (!token) {
            setError("Authentification requise pour afficher les notes.");
            setLoading(false);
            return;
        }

        try {
            const response = await axios.get(`${API_BASE_URL}/notes/`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            setNotes(response.data);
        } catch (err) {
            console.error("Erreur lors du chargement des notes :", err);
            setError("Impossible de charger les notes.");
        } finally {
            setLoading(false);
        }
    };

    const handleNewNote = () => {
        setShowForm(true);
        setEditingNote(null);
        setFormData({ title: '', content: '' });
    };

    const handleEdit = (note: Note) => {
        setShowForm(true);
        setEditingNote(note);
        setFormData({ title: note.title, content: note.content });
    };

    const handleDelete = async (noteId: number) => {
        if (!window.confirm("Êtes-vous sûr de vouloir supprimer cette note ?")) {
            return;
        }

        try {
            await axios.delete(`${API_BASE_URL}/notes/${noteId}/`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            setNotes(notes.filter(note => note.id !== noteId));
        } catch (err) {
                console.error("Erreur lors de la suppression de la note :", err);
                setError("Impossible de supprimer la note.");
            }
        };

        const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
            const { name, value } = e.target;
            setFormData(prevData => ({ ...prevData, [name]: value }));
        };

        const handleSubmit = async (e: React.FormEvent) => {
            e.preventDefault();
            setLoading(true);

            const url = editingNote
                ? `${API_BASE_URL}/notes/${editingNote.id}/`
                : `${API_BASE_URL}/notes/`;
            const method = editingNote ? axios.put : axios.post;

            try {
                await method(url, formData, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                setShowForm(false);
                setEditingNote(null);
                fetchNotes();
            } catch (err) {
                console.error("Erreur lors de la soumission du formulaire :", err);
                setError("Impossible d'enregistrer la note.");
            } finally {
                setLoading(false);
            }
        };

        if (loading) {
            return <div className="text-page-container loading-message">Chargement des notes...</div>;
        }

        if (error) {
            return <div className="text-page-container error-message">{error}</div>;
        }

        return (
            <div className="text-page-container">
                <div className="page-header">
                    <h1>Notes de consultation</h1>
                    <button onClick={handleNewNote} className="action-button content-button">
                        Nouvelle Note
                    </button>
                </div>
                {showForm && (
                    <div className="form-container detail-info-group">
                        <h3>{editingNote ? 'Modifier la note' : 'Créer une nouvelle note'}</h3>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label htmlFor="title">Titre</label>
                                <input
                                    type="text"
                                    id="title"
                                    name="title"
                                    value={formData.title}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="content">Contenu</label>
                                <textarea
                                    id="content"
                                    name="content"
                                    value={formData.content}
                                    onChange={handleChange}
                                    required
                                ></textarea>
                            </div>
                            <div className="form-actions">
                                <button type="submit" className="action-button content-button" disabled={loading}>
                                    {loading ? 'En cours...' : 'Enregistrer'}
                                </button>
                                <button type="button" onClick={() => setShowForm(false)} className="action-button cancel-button">
                                    Annuler
                                </button>
                            </div>
                        </form>
                    </div>
                )}
                {!showForm && (
                    <div className="notes-list detail-list">
                        {notes.length > 0 ? (
                            <ul>
                                {notes.map(note => (
                                    <li key={note.id} className="note-item detail-list-item">
                                        <div className="note-header content-section">
                                            <h4>{note.title}</h4>
                                            <span className="date">{new Date(note.created_at).toLocaleDateString()}</span>
                                        </div>
                                        <p>{note.content}</p>
                                        <div className="note-actions entry-actions">
                                            <button onClick={() => handleEdit(note)} className="action-button edit-button">
                                                Modifier
                                            </button>
                                            <button onClick={() => handleDelete(note.id)} className="action-button delete-button">
                                                Supprimer
                                            </button>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="no-data-message">Aucune note de consultation à afficher.</p>
                        )}
                    </div>
                )}
            </div>
        );
    };

    export default Notes;