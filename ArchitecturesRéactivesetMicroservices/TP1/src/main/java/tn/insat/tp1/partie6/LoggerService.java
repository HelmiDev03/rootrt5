package tn.insat.tp1.partie6;

/**
 * Partie 6 - Étape 9 : observateur qui écrit chaque changement d'état dans le journal.
 */
public class LoggerService implements Observer {

    @Override
    public void update(String status) {
        System.out.println("LoggerService : [LOG] order status changed to " + status);
    }
}
