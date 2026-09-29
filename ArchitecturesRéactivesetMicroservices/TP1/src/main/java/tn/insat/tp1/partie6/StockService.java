package tn.insat.tp1.partie6;

/**
 * Partie 6 - Étape 9 : observateur qui met à jour le stock.
 * <p>
 * Ici, la mise à jour du stock est simulée par un affichage.
 */
public class StockService implements Observer {

    @Override
    public void update(String status) {
        System.out.println("StockService : stock updated, order status = " + status);
    }
}
