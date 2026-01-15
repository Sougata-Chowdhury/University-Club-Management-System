import React, { createContext, useContext } from 'react';
import { useTheme } from './ThemeContext';

const LanguageContext = createContext();

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

const translations = {
  en: {
    // Navigation
    dashboard: 'Dashboard',
    profile: 'Profile',
    settings: 'Settings',
    logout: 'Logout',
    backToDashboard: '← Back to Dashboard',
    
    // Dashboard
    welcomeBack: 'Welcome back',
    quickActions: 'Quick Actions',
    browseClubs: 'Browse Clubs',
    createClub: 'Create Club',
    browseEvents: 'Browse Events',
    createEvent: 'Create Event',
    myClubs: 'My Clubs',
    myEvents: 'My Events',
    announcements: 'Announcements',
    
    // Profile
    myProfile: 'My Profile',
    editProfile: 'Edit Profile',
    personalInformation: 'Personal Information',
    academicInformation: 'Academic Information',
    aboutMe: 'About Me',
    firstName: 'First Name',
    lastName: 'Last Name',
    email: 'Email Address',
    phone: 'Phone Number',
    studentId: 'Student ID',
    department: 'Department',
    yearOfStudy: 'Year of Study',
    clubsJoined: 'Clubs Joined',
    eventsHosted: 'Events Hosted',
    leadershipRoles: 'Leadership Roles',
    
    // Settings
    preferences: 'Preferences',
    notifications: 'Notifications',
    security: 'Security',
    activity: 'Activity',
    appearance: 'Appearance',
    theme: 'Theme',
    language: 'Language',
    interests: 'Interests',
    addNewInterest: 'Add new interest',
    emailNotifications: 'Email Notifications',
    pushNotifications: 'Push Notifications',
    clubNotifications: 'Club Notifications',
    eventNotifications: 'Event Notifications',
    changePassword: 'Change Password',
    currentPassword: 'Current Password',
    newPassword: 'New Password',
    confirmNewPassword: 'Confirm New Password',
    
    // Settings Page Specific
    failedToLoadSettings: 'Failed to load settings. Please try again.',
    newPasswordsDontMatch: 'New passwords do not match.',
    newPasswordTooShort: 'New password must be at least 6 characters long.',
    newPasswordSameAsCurrent: 'New password must be different from current password.',
    failedToChangePassword: 'Failed to change password. Please check your current password.',
    failedToUpdateSettings: 'Failed to update settings. Please try again.',
    enterCurrentPassword: 'Enter your current password',
    enterNewPassword: 'Enter your new password',
    confirmYourNewPassword: 'Confirm your new password',
    changing: 'Changing...',
    saveNotificationSettings: 'Save Notification Settings',
    securitySettings: 'Security Settings',
    accountSettings: 'Account Settings',
    languageSettings: 'Language Settings',
    notificationSettings: 'Notification Settings',
    accountInformation: 'Account Information',
    accountStatus: 'Account Status',
    userActivity: 'User Activity',
    recentActivity: 'Recent Activity',
    noRecentActivityToDisplay: 'No recent activity to display',
    notificationsAboutClubActivities: 'Notifications about club activities',
    notificationsAboutUpcomingEvents: 'Notifications about upcoming events',
    
    // Common
    save: 'Save',
    cancel: 'Cancel',
    edit: 'Edit',
    delete: 'Delete',
    create: 'Create',
    update: 'Update',
    loading: 'Loading...',
    saving: 'Saving...',
    success: 'Success!',
    error: 'Error',
    
    // Themes
    light: 'Light',
    dark: 'Dark',
    auto: 'Auto',
    
    // Messages
    profileUpdatedSuccessfully: 'Profile updated successfully!',
    settingsUpdatedSuccessfully: 'Settings updated successfully!',
    passwordChangedSuccessfully: 'Password changed successfully!',
    imageUploadedSuccessfully: 'Profile picture updated successfully!',
    failedToUpdateProfile: 'Failed to update profile. Please try again.',
    failedToUploadImage: 'Failed to upload image. Please try again.',
    selectValidImage: 'Please select a valid image file (JPG, PNG, GIF)',
    imageSizeTooLarge: 'Image size must be less than 5MB',
    
    // Admin
    adminDashboard: 'Admin Dashboard',
    adminDashboardSubtitle: 'Manage system, users, clubs, and payments',
    userManagement: 'User Management',
    clubManagement: 'Club Management',
    paymentManagement: 'Payment Management',
    systemReports: 'System Reports',
    totalUsers: 'Total Users',
    totalClubs: 'Total Clubs',
    totalEvents: 'Total Events',
    totalRevenue: 'Total Revenue',
    pendingClubs: 'Pending Clubs',
    pendingPayments: 'Pending Payments',
    activeUsers: 'Active Users',
    active: 'Active',
    inactive: 'Inactive',
    pending: 'Pending',
    approved: 'Approved',
    rejected: 'Rejected',
    approve: 'Approve',
    reject: 'Reject',
    upcoming: 'Upcoming',
    systemHealth: 'System Health',
    databaseStatus: 'Database Status',
    apiStatus: 'API Status',
    fileStorage: 'File Storage',
    online: 'Online',
    operational: 'Operational',
    available: 'Available',
    lastUpdated: 'Last Updated',
    noRecentActivity: 'No recent activity',
    newUserRegistered: 'New user registered',
    newClubCreated: 'New club created',
    recentUsers: 'Recent Users',
    recentClubs: 'Recent Clubs',
    recentEvents: 'Recent Events',
    refreshing: 'Refreshing',
    refresh: 'Refresh',
    manageUserAccounts: 'Manage user accounts',
    reviewClubApplications: 'Review club applications',
    reviewPaymentRequests: 'Review payment requests',
    viewAnalyticsReports: 'View analytics and reports',
    manageUserAccountsDescription: 'View and manage all user accounts in the system',
    searchUsers: 'Search users by name, email, or student ID',
    user: 'User',
    role: 'Role',
    status: 'Status',
    joinedDate: 'Joined Date',
    actions: 'Actions',
    activate: 'Activate',
    deactivate: 'Deactivate',
    selectAction: 'Select Action',
    apply: 'Apply',
    processing: 'Processing',
    noUsersFound: 'No users found',
    noUsersMatchSearch: 'No users match your search criteria',
    noUsersRegistered: 'No users have been registered yet',
    page: 'Page',
    of: 'of',
    confirmDelete: 'Confirm Delete',
    confirmDeleteUser: 'Are you sure you want to delete user {{name}}? This action cannot be undone.',
    deleting: 'Deleting',
    reviewPendingClubApplications: 'Review and approve pending club applications',
    noPendingClubs: 'No Pending Clubs',
    allClubsReviewed: 'All club applications have been reviewed',
    upToDate: 'You\'re all up to date!',
    pendingClubsCount: '{{count}} club applications awaiting review',
    reviewEachClubCarefully: 'Please review each club application carefully before making a decision',
    createdBy: 'Created by',
    created: 'Created',
    tags: 'Tags',
    requirements: 'Requirements',
    meetingSchedule: 'Meeting Schedule',
    loadingClubs: 'Loading clubs',
    rejectClub: 'Reject Club',
    rejectClubConfirmation: 'Are you sure you want to reject the club "{{name}}"?',
    rejectionReason: 'Rejection Reason',
    rejectionReasonPlaceholder: 'Please provide a reason for rejecting this club application...',
    rejecting: 'Rejecting',
    reviewPendingPaymentRequests: 'Review and process pending payment requests',
    paymentId: 'Payment ID',
    submitted: 'Submitted',
    club: 'Club',
    event: 'Event',
    paymentMethod: 'Payment Method',
    notSpecified: 'Not specified',
    notes: 'Notes',
    transactionId: 'Transaction ID',
    noPendingPayments: 'No Pending Payments',
    allPaymentsProcessed: 'All payment requests have been processed',
    pendingPaymentsCount: '{{count}} payment requests awaiting review',
    totalAmount: 'Total Amount',
    loadingPayments: 'Loading payments',
    rejectPayment: 'Reject Payment',
    rejectPaymentConfirmation: 'Are you sure you want to reject this payment of {{amount}}?',
    paymentRejectionReasonPlaceholder: 'Please provide a reason for rejecting this payment...',
    analyticsAndReportsDescription: 'View system analytics and generate detailed reports',
    exportReport: 'Export Report',
    startDate: 'Start Date',
    endDate: 'End Date',
    reportType: 'Report Type',
    systemOverview: 'System Overview',
    userAnalytics: 'User Analytics',
    clubAnalytics: 'Club Analytics',
    eventAnalytics: 'Event Analytics',
    paymentAnalytics: 'Payment Analytics',
    generatingReport: 'Generating report',
    totalTransactions: 'Total Transactions',
    averageAmount: 'Average Amount',
    userGrowth: 'User Growth',
    clubGrowth: 'Club Growth',
    eventGrowth: 'Event Growth',
    topClubsByMembers: 'Top Clubs by Members',
    topEventsByRegistrations: 'Top Events by Registrations',
    members: 'Members',
    registrations: 'Registrations',
    noDataAvailable: 'No data available',
    reportSummary: 'Report Summary',
    reportPeriod: 'Report Period',
    generatedOn: 'Generated On',
    noReportData: 'No Report Data',
    selectDateRangeToGenerate: 'Select a date range to generate reports',
  },
  
  es: {
    // Navigation
    dashboard: 'Panel de Control',
    profile: 'Perfil',
    settings: 'Configuración',
    logout: 'Cerrar Sesión',
    backToDashboard: '← Volver al Panel',
    
    // Dashboard
    welcomeBack: 'Bienvenido de vuelta',
    quickActions: 'Acciones Rápidas',
    browseClubs: 'Explorar Clubes',
    createClub: 'Crear Club',
    browseEvents: 'Explorar Eventos',
    createEvent: 'Crear Evento',
    myClubs: 'Mis Clubes',
    myEvents: 'Mis Eventos',
    announcements: 'Anuncios',
    
    // Profile
    myProfile: 'Mi Perfil',
    editProfile: 'Editar Perfil',
    personalInformation: 'Información Personal',
    academicInformation: 'Información Académica',
    aboutMe: 'Sobre Mí',
    firstName: 'Nombre',
    lastName: 'Apellido',
    email: 'Correo Electrónico',
    phone: 'Teléfono',
    studentId: 'ID de Estudiante',
    department: 'Departamento',
    yearOfStudy: 'Año de Estudio',
    clubsJoined: 'Clubes Unidos',
    eventsHosted: 'Eventos Organizados',
    leadershipRoles: 'Roles de Liderazgo',
    
    // Settings
    preferences: 'Preferencias',
    notifications: 'Notificaciones',
    security: 'Seguridad',
    activity: 'Actividad',
    appearance: 'Apariencia',
    theme: 'Tema',
    language: 'Idioma',
    interests: 'Intereses',
    addNewInterest: 'Agregar nuevo interés',
    emailNotifications: 'Notificaciones por Email',
    pushNotifications: 'Notificaciones Push',
    clubNotifications: 'Notificaciones de Club',
    eventNotifications: 'Notificaciones de Eventos',
    changePassword: 'Cambiar Contraseña',
    currentPassword: 'Contraseña Actual',
    newPassword: 'Nueva Contraseña',
    confirmNewPassword: 'Confirmar Nueva Contraseña',
    
    // Settings Page Specific
    failedToLoadSettings: 'Error al cargar configuración. Inténtalo de nuevo.',
    newPasswordsDontMatch: 'Las nuevas contraseñas no coinciden.',
    newPasswordTooShort: 'La nueva contraseña debe tener al menos 6 caracteres.',
    newPasswordSameAsCurrent: 'La nueva contraseña debe ser diferente a la actual.',
    failedToChangePassword: 'Error al cambiar contraseña. Verifica tu contraseña actual.',
    failedToUpdateSettings: 'Error al actualizar configuración. Inténtalo de nuevo.',
    enterCurrentPassword: 'Ingresa tu contraseña actual',
    enterNewPassword: 'Ingresa tu nueva contraseña',
    confirmYourNewPassword: 'Confirma tu nueva contraseña',
    changing: 'Cambiando...',
    saveNotificationSettings: 'Guardar Configuración de Notificaciones',
    securitySettings: 'Configuración de Seguridad',
    accountSettings: 'Configuración de Cuenta',
    languageSettings: 'Configuración de Idioma',
    notificationSettings: 'Configuración de Notificaciones',
    accountInformation: 'Información de Cuenta',
    accountStatus: 'Estado de Cuenta',
    userActivity: 'Actividad del Usuario',
    recentActivity: 'Actividad Reciente',
    noRecentActivityToDisplay: 'No hay actividad reciente para mostrar',
    notificationsAboutClubActivities: 'Notificaciones sobre actividades de clubes',
    notificationsAboutUpcomingEvents: 'Notificaciones sobre próximos eventos',
    
    // Common
    save: 'Guardar',
    cancel: 'Cancelar',
    edit: 'Editar',
    delete: 'Eliminar',
    create: 'Crear',
    update: 'Actualizar',
    loading: 'Cargando...',
    saving: 'Guardando...',
    success: '¡Éxito!',
    error: 'Error',
    
    // Themes
    light: 'Claro',
    dark: 'Oscuro',
    auto: 'Automático',
    
    // Messages
    profileUpdatedSuccessfully: '¡Perfil actualizado exitosamente!',
    settingsUpdatedSuccessfully: '¡Configuración actualizada exitosamente!',
    passwordChangedSuccessfully: '¡Contraseña cambiada exitosamente!',
    imageUploadedSuccessfully: '¡Foto de perfil actualizada exitosamente!',
    failedToUpdateProfile: 'Error al actualizar perfil. Inténtalo de nuevo.',
    failedToUploadImage: 'Error al subir imagen. Inténtalo de nuevo.',
    selectValidImage: 'Selecciona un archivo de imagen válido (JPG, PNG, GIF)',
    imageSizeTooLarge: 'El tamaño de la imagen debe ser menor a 5MB',
  },
  
  fr: {
    // Navigation
    dashboard: 'Tableau de Bord',
    profile: 'Profil',
    settings: 'Paramètres',
    logout: 'Déconnexion',
    backToDashboard: '← Retour au Tableau de Bord',
    
    // Dashboard
    welcomeBack: 'Bon retour',
    quickActions: 'Actions Rapides',
    browseClubs: 'Explorer les Clubs',
    createClub: 'Créer un Club',
    browseEvents: 'Explorer les Événements',
    createEvent: 'Créer un Événement',
    myClubs: 'Mes Clubs',
    myEvents: 'Mes Événements',
    announcements: 'Annonces',
    
    // Profile
    myProfile: 'Mon Profil',
    editProfile: 'Modifier le Profil',
    personalInformation: 'Informations Personnelles',
    academicInformation: 'Informations Académiques',
    aboutMe: 'À Propos de Moi',
    firstName: 'Prénom',
    lastName: 'Nom de Famille',
    email: 'Adresse Email',
    phone: 'Téléphone',
    studentId: 'ID Étudiant',
    department: 'Département',
    yearOfStudy: 'Année d\'Étude',
    clubsJoined: 'Clubs Rejoints',
    eventsHosted: 'Événements Organisés',
    leadershipRoles: 'Rôles de Leadership',
    
    // Settings
    preferences: 'Préférences',
    notifications: 'Notifications',
    security: 'Sécurité',
    activity: 'Activité',
    appearance: 'Apparence',
    theme: 'Thème',
    language: 'Langue',
    interests: 'Intérêts',
    addNewInterest: 'Ajouter un nouvel intérêt',
    emailNotifications: 'Notifications Email',
    pushNotifications: 'Notifications Push',
    clubNotifications: 'Notifications de Club',
    eventNotifications: 'Notifications d\'Événements',
    changePassword: 'Changer le Mot de Passe',
    currentPassword: 'Mot de Passe Actuel',
    newPassword: 'Nouveau Mot de Passe',
    confirmNewPassword: 'Confirmer le Nouveau Mot de Passe',
    
    // Settings Page Specific
    failedToLoadSettings: 'Échec du chargement des paramètres. Veuillez réessayer.',
    newPasswordsDontMatch: 'Les nouveaux mots de passe ne correspondent pas.',
    newPasswordTooShort: 'Le nouveau mot de passe doit contenir au moins 6 caractères.',
    newPasswordSameAsCurrent: 'Le nouveau mot de passe doit être différent de l\'actuel.',
    failedToChangePassword: 'Échec du changement de mot de passe. Vérifiez votre mot de passe actuel.',
    failedToUpdateSettings: 'Échec de la mise à jour des paramètres. Veuillez réessayer.',
    enterCurrentPassword: 'Entrez votre mot de passe actuel',
    enterNewPassword: 'Entrez votre nouveau mot de passe',
    confirmYourNewPassword: 'Confirmez votre nouveau mot de passe',
    changing: 'Changement...',
    saveNotificationSettings: 'Enregistrer les Paramètres de Notification',
    securitySettings: 'Paramètres de Sécurité',
    accountInformation: 'Informations du Compte',
    accountStatus: 'Statut du Compte',
    userActivity: 'Activité Utilisateur',
    recentActivity: 'Activité Récente',
    noRecentActivityToDisplay: 'Aucune activité récente à afficher',
    notificationsAboutClubActivities: 'Notifications sur les activités des clubs',
    notificationsAboutUpcomingEvents: 'Notifications sur les événements à venir',
    
    // Common
    save: 'Enregistrer',
    cancel: 'Annuler',
    edit: 'Modifier',
    delete: 'Supprimer',
    create: 'Créer',
    update: 'Mettre à Jour',
    loading: 'Chargement...',
    saving: 'Enregistrement...',
    success: 'Succès!',
    error: 'Erreur',
    
    // Themes
    light: 'Clair',
    dark: 'Sombre',
    auto: 'Automatique',
    
    // Messages
    profileUpdatedSuccessfully: 'Profil mis à jour avec succès!',
    settingsUpdatedSuccessfully: 'Paramètres mis à jour avec succès!',
    passwordChangedSuccessfully: 'Mot de passe changé avec succès!',
    imageUploadedSuccessfully: 'Photo de profil mise à jour avec succès!',
    failedToUpdateProfile: 'Échec de la mise à jour du profil. Veuillez réessayer.',
    failedToUploadImage: 'Échec du téléchargement de l\'image. Veuillez réessayer.',
    selectValidImage: 'Veuillez sélectionner un fichier image valide (JPG, PNG, GIF)',
    imageSizeTooLarge: 'La taille de l\'image doit être inférieure à 5MB',
  }
};

export const LanguageProvider = ({ children }) => {
  const { language, updateLanguage } = useTheme();
  
  const t = (key) => {
    return translations[language]?.[key] || translations.en[key] || key;
  };
  
  const getCurrentLanguage = () => language;
  
  const getLanguageOptions = () => [
    { value: 'en', label: 'English' },
    { value: 'es', label: 'Español' },
    { value: 'fr', label: 'Français' }
  ];
  
  // Enhanced updateLanguage function that ensures consistent website update
  const handleLanguageChange = async (newLanguage) => {
    try {
      // Update language through ThemeContext (which handles persistence)
      await updateLanguage(newLanguage);
      
      // Force re-render of all components by updating the key prop
      // This ensures all components immediately reflect the new language
      const event = new CustomEvent('languageChanged', { 
        detail: { language: newLanguage } 
      });
      window.dispatchEvent(event);
      
      console.log(`Language changed to: ${newLanguage}`);
    } catch (error) {
      console.error('Error updating language:', error);
    }
  };
  
  const value = {
    t,
    language,
    updateLanguage: handleLanguageChange,
    getCurrentLanguage,
    getLanguageOptions
  };
  
  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};
