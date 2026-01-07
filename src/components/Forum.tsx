import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../hooks/useAuth';
import './DetailStyles.css';
import './TextStyles.css';

const API_BASE_URL = 'http://127.0.0.1:8000/api';

interface ForumComment {
    id: number;
    author_name: string;
    author_specialty: string;
    content: string;
    created_at: string;
}

interface ForumPost {
    id: number;
    author_name: string;
    author_specialty: string;
    title: string;
    content: string;
    created_at: string;
    comments: ForumComment[];
}

const Forum = () => {
    const { token } = useAuth();
    const [posts, setPosts] = useState<ForumPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [newPost, setNewPost] = useState({ title: '', content: '' });
    const [newComment, setNewComment] = useState<{ [key: number]: string }>({});

    useEffect(() => {
        fetchPosts();
    }, [token]);

    const fetchPosts = async () => {
        if (!token) {
            setError("Authentification requise pour accéder au forum.");
            setLoading(false);
            return;
        }

        try {
            const response = await axios.get(`${API_BASE_URL}/forum/posts/`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            setPosts(response.data);
        } catch (err) {
            console.error("Erreur lors du chargement des posts :", err);
            setError("Impossible de charger le forum.");
        } finally {
            setLoading(false);
        }
    };

    const handlePostChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setNewPost(prevData => ({ ...prevData, [name]: value }));
    };

    const handleCommentChange = (postId: number, content: string) => {
        setNewComment(prev => ({ ...prev, [postId]: content }));
    };

    const handlePostSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await axios.post(`${API_BASE_URL}/forum/posts/`, newPost, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            setNewPost({ title: '', content: '' });
            fetchPosts();
        } catch (err) {
            console.error("Erreur lors de la création du post :", err);
            setError("Impossible de publier le post.");
        }
    };

    const handleCommentSubmit = async (postId: number) => {
        if (!newComment[postId]) return;
        try {
            await axios.post(`${API_BASE_URL}/forum/comments/`, {
                post: postId,
                content: newComment[postId],
            }, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            setNewComment(prev => ({ ...prev, [postId]: '' }));
            fetchPosts();
        } catch (err) {
            console.error("Erreur lors de l'ajout du commentaire :", err);
            setError("Impossible d'ajouter le commentaire.");
        }
    };

    if (loading) {
        return <div className="text-page-container loading-message">Chargement du forum...</div>;
    }

    if (error) {
        return <div className="text-page-container error-message">{error}</div>;
    }

    return (
        <div className="text-page-container">
            <div className="page-header">
                <h1>Forum professionnel</h1>
            </div>

            {/* Formulaire pour créer un nouveau post */}
            <div className="new-post-form detail-info-group">
                <h3>Créer un nouveau sujet</h3>
                <form onSubmit={handlePostSubmit}>
                    <div className="form-group">
                        <input
                            type="text"
                            name="title"
                            placeholder="Titre du sujet"
                            value={newPost.title}
                            onChange={handlePostChange}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <textarea
                            name="content"
                            placeholder="Votre message..."
                            value={newPost.content}
                            onChange={handlePostChange}
                            required
                        />
                    </div>
                    <button type="submit" className="action-button content-button">Publier</button>
                </form>
            </div>

            {/* Liste des posts du forum */}
            <div className="posts-list">
                {posts.length > 0 ? (
                    posts.map(post => (
                        <div key={post.id} className="forum-post content-section">
                            <div className="post-header">
                                <h2>{post.title}</h2>
                                <div className="section-footer">
                                    <span className="author">Dr. {post.author_name} ({post.author_specialty})</span>
                                    <span className="date">le {new Date(post.created_at).toLocaleDateString()}</span>
                                </div>
                            </div>
                            <p className="post-content">{post.content}</p>

                            {/* Section des commentaires */}
                            <div className="comments-section">
                                <div className="separator"></div>
                                <h4>Commentaires ({post.comments.length})</h4>
                                <div className="comments-list detail-list">
                                    {post.comments.map(comment => (
                                        <div key={comment.id} className="comment-item detail-list-item">
                                            <p>{comment.content}</p>
                                            <div className="section-footer">
                                                <span className="author">Dr. {comment.author_name}</span>
                                                <span className="date">le {new Date(comment.created_at).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                {/* Formulaire pour ajouter un commentaire */}
                                <form onSubmit={(e) => { e.preventDefault(); handleCommentSubmit(post.id); }} className="comment-form">
                                    <div className="form-group">
                                        <textarea
                                            placeholder="Ajouter un commentaire..."
                                            value={newComment[post.id] || ''}
                                            onChange={(e) => handleCommentChange(post.id, e.target.value)}
                                            required
                                        />
                                    </div>
                                    <button type="submit" className="action-button content-button">Commenter</button>
                                </form>
                            </div>
                        </div>
                    ))
                ) : (
                    <p className="no-data-message">Aucun sujet de discussion pour le moment. Soyez le premier à en créer un !</p>
                )}
            </div>
        </div>
    );
};

export default Forum;