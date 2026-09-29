package tn.insat.tp1.partie6;

/**
 * Partie 6 - Étape 9 : observateur qui prévient le client par e-mail.
 * <p>
 * Ici, l'envoi de l'e-mail est simulé par un affichage.
 */
public class EmailService implements Observer {

    @Override
    public void update(String status) {
        System.out.println("EmailService : email sent to customer, order status = " + status);
    }
}
