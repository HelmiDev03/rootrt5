package tn.insat.tp1.partie7;

/**
 * Partie 7 - Étapes 3 et 4 : test du service de notification refactorisé.
 */
public class Main {

    public static void main(String[] args) {
        String message = "Your order has been shipped";

        // Étape 3 : on choisit la stratégie Email au départ
        NotificationService service = new NotificationService(new EmailNotification());
        service.send(message);

        // On change de stratégie pendant l'exécution, sans aucun if/else
        service.setNotification(new SmsNotification());
        service.send(message);

        service.setNotification(new PushNotification());
        service.send(message);

        // Étape 4 : WhatsApp est une nouvelle classe, NotificationService n'a pas été modifié
        service.setNotification(new WhatsAppNotification());
        service.send(message);
    }
}
