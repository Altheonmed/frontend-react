import { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import axios from 'axios';
import { useAuth } from '../hooks/useAuth';
import { type Appointment, type Patient, type Workplace } from '../types';
import AppointmentForm from './AppointmentForm';
import DeleteAppointmentModal from './DeleteAppointmentModal.tsx';
import { useNavigate } from 'react-router-dom';
import './DetailStyles.css';
import './Appointments.css';

const API_BASE_URL = 'http://127.0.0.1:8000/api';

interface AppointmentWithDetails extends Appointment {
    patient_details: Patient;
    workplace_details: Workplace;
}

const Appointments = () => {
    const { token } = useAuth();
    const navigate = useNavigate();
    const [date, setDate] = useState<Date>(new Date());
    const [appointments, setAppointments] = useState<AppointmentWithDetails[]>([]);
    const [isFormVisible, setIsFormVisible] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
    const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
    const [appointmentDates, setAppointmentDates] = useState<string[]>([]);

    const fetchAppointments = async () => {
        setIsLoading(true);
        setError(null);
        if (!token) {
            setError("Vous n'êtes pas authentifié.");
            setIsLoading(false);
            return;
        }

        try {
            const response = await axios.get<AppointmentWithDetails[]>(`${API_BASE_URL}/appointments/`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            setAppointments(response.data);
            
            // Correction ici : Spécifiez le type de l'objet 'appt'
            const dates = response.data.map((appt: AppointmentWithDetails) => new Date(appt.appointment_date).toDateString());
            setAppointmentDates([...new Set(dates)]);
        } catch (err) {
            console.error("Erreur lors de la récupération des rendez-vous :", err);
            setError("Impossible de charger les rendez-vous.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchAppointments();
    }, [token]);

    const handleDateChange = (newDate: any) => {
        if (newDate instanceof Date) {
            setDate(newDate);
        }
    };

    const handleCreateAppointmentClick = () => {
        setSelectedAppointment(null);
        setIsFormVisible(true);
    };

    const handleEditAppointment = (appointment: Appointment) => {
        setSelectedAppointment(appointment);
        setIsFormVisible(true);
    };

    const handleDeleteClick = (appointment: Appointment) => {
        setSelectedAppointment(appointment);
        setIsDeleteModalVisible(true);
    };

    const handleFormSuccess = () => {
        setIsFormVisible(false);
        setSelectedAppointment(null);
        fetchAppointments();
    };

    const handleFormCancel = () => {
        setIsFormVisible(false);
        setSelectedAppointment(null);
    };
    
    const handleDeleteSuccess = () => {
        setIsDeleteModalVisible(false);
        setSelectedAppointment(null);
        fetchAppointments();
    };

    const handleDeleteCancel = () => {
        setIsDeleteModalVisible(false);
        setSelectedAppointment(null);
    };

    const handleViewDeletedAppointments = () => {
        navigate('/deleted-appointments');
    };

    const appointmentsForSelectedDate = appointments.filter(appt => {
        const apptDate = new Date(appt.appointment_date);
        return apptDate.getFullYear() === date.getFullYear() &&
               apptDate.getMonth() === date.getMonth() &&
               apptDate.getDate() === date.getDate();
    });

    const tileClassName = ({ date, view }: { date: Date, view: string }) => {
        if (view === 'month') {
            const dateString = date.toDateString();
            if (appointmentDates.includes(dateString)) {
                return 'has-appointment';
            }
        }
        return null;
    };

    return (
        <div className="appointments-page">
            <h2>Gestion des rendez-vous</h2>
            <div className="calendar-container">
                <Calendar
                    onChange={handleDateChange}
                    value={date}
                    tileClassName={tileClassName}
                />
                <button onClick={handleCreateAppointmentClick} className="create-appt-button">
                    Créer un rendez-vous le {date.toLocaleDateString()}
                </button>
                <button onClick={handleViewDeletedAppointments} className="view-deleted-button">
                    Voir les rendez-vous supprimés
                </button>
            </div>

            <div className="appointments-list">
                <h3>Rendez-vous pour le {date.toLocaleDateString()}</h3>
                {isLoading && <p>Chargement des rendez-vous...</p>}
                {error && <p className="error-message">{error}</p>}
                {!isLoading && appointmentsForSelectedDate.length === 0 ? (
                    <p>Aucun rendez-vous pour cette date.</p>
                ) : (
                    appointmentsForSelectedDate.map(appt => (
                        <div key={appt.id} className="appointment-item">
                            <p><strong>Patient:</strong> {appt.patient_details ? `${appt.patient_details.first_name} ${appt.patient_details.last_name}` : 'Nom du patient indisponible'}</p>
                            <p><strong>Lieu de travail:</strong> {appt.workplace_details ? appt.workplace_details.name : 'Nom du lieu indisponible'}</p>
                            <p><strong>Heure:</strong> {new Date(appt.appointment_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                            <p><strong>Motif:</strong> {appt.reason_for_appointment}</p>
                            <div className="appointment-actions">
                                <button onClick={() => handleEditAppointment(appt)} className="action-button edit-button">Modifier</button>
                                <button onClick={() => handleDeleteClick(appt)} className="action-button delete-button">Supprimer</button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {isFormVisible && (
                <AppointmentForm 
                    initialDate={date}
                    appointment={selectedAppointment}
                    onSuccess={handleFormSuccess}
                    onCancel={handleFormCancel}
                />
            )}
            
            {isDeleteModalVisible && selectedAppointment && (
                <DeleteAppointmentModal
                    appointment={selectedAppointment}
                    onSuccess={handleDeleteSuccess}
                    onCancel={handleDeleteCancel}
                />
            )}
        </div>
    );
};

export default Appointments;