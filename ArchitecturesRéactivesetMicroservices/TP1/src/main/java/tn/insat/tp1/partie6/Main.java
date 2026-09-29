package tn.insat.tp1.partie6;

/**
 * Partie 6 - Étape 11 : test du passage de l'état CREATED à SHIPPED (code de l'énoncé).
 */
public class Main {

    public static void main(String[] args) {
        Order order = new Order();

        order.attach(new EmailService());
        order.attach(new StockService());
        order.attach(new LoggerService());

        System.out.println("Initial status Before Update : " + order.getStatus());
        order.setStatus("SHIPPED");
    }
}
