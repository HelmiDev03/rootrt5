package tn.insat.tp1.partie7;

/**
 * Partie 7 - Étape 4 : nouveau moyen de notification, ajouté SANS modifier NotificationService.
 * Rôle dans le pattern Strategy : ConcreteStrategy (une stratégie concrète).
 * <p>
 * Pour l'ajouter, il a suffi d'écrire cette classe : aucune autre classe n'a changé.
 */
public class WhatsAppNotification implements Notification {

    @Override
    public void send(String message) {
        System.out.println("Sending WhatsApp : " + message);
    }
}
