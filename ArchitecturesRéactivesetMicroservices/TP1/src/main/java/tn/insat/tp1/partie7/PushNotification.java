package tn.insat.tp1.partie7;

/**
 * Partie 7 - Étape 3 : envoi d'une notification push (sur le téléphone).
 * Rôle dans le pattern Strategy : ConcreteStrategy (une stratégie concrète).
 */
public class PushNotification implements Notification {

    @Override
    public void send(String message) {
        System.out.println("Sending Push Notification : " + message);
    }
}
