package tn.insat.tp1.partie7;

/**
 * Partie 7 - Étape 3 : service de notification refactorisé (pattern Strategy).
 * Rôle dans le pattern Strategy : Context (le « contexte »).
 * <p>
 * Il ne contient plus aucun if/else : il garde une stratégie et lui confie l'envoi.
 * Il ne connaît que l'interface Notification, jamais Email, SMS, Push ou WhatsApp.
 */
public class NotificationService {

    // La stratégie utilisée en ce moment (Email, SMS, Push, WhatsApp...).
    private Notification notification;

    public NotificationService(Notification notification) {
        this.notification = notification;
    }

    // Permet de changer de stratégie pendant l'exécution.
    public void setNotification(Notification notification) {
        this.notification = notification;
    }

    public void send(String message) {
        // Délégation : c'est l'objet stratégie qui sait comment envoyer le message.
        notification.send(message);
    }
}
