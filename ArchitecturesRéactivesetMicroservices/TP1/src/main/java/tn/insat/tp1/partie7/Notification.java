package tn.insat.tp1.partie7;

/**
 * Partie 7 - Étape 3 : interface commune à tous les moyens de notification.
 * Rôle dans le pattern Strategy : Strategy (la « stratégie »).
 * <p>
 * Chaque moyen d'envoi (Email, SMS, Push...) est une classe qui implémente cette interface.
 */
public interface Notification {

    void send(String message);
}
