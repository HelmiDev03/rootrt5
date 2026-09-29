package tn.insat.tp1.partie7;

/**
 * Partie 7 - Étape 3 : envoi d'une notification par e-mail.
 * Rôle dans le pattern Strategy : ConcreteStrategy (une stratégie concrète).
 */
public class EmailNotification implements Notification {

    @Override
    public void send(String message) {
        System.out.println("Sending Email : " + message);
    }
}
