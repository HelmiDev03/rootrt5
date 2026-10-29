package tn.insat.tp2.partie1.avant;

import java.util.List;

/** Fait tourner le code existant, puis montre ses trois problèmes à l'exécution. */
public class Main {

    public static void main(String[] args) {
        Order cmd001 = new Order("CMD-001", "VIP", "amira@shopflow.tn", "+216 20 111 222",
                List.of(new Item("Laptop", 1200.0, 1), new Item("Souris", 25.0, 2)));
        Order cmd002 = new Order("CMD-002", "STANDARD", "youssef@shopflow.tn", "+216 50 333 444",
                List.of(new Item("Livre Clean Code", 45.0, 2), new Item("Clavier", 60.0, 1)));
        Order cmd003 = new Order("CMD-003", "STANDARD", "salma@shopflow.tn", "+216 98 555 666",
                List.of(new Item("Casque", 80.0, 1)));
        Order cmd004 = new Order("CMD-004", "VIP", "karim@shopflow.tn", "+216 22 777 888",
                List.of(new Item("Écran", 300.0, 2)));

        OrderProcessor processor = new OrderProcessor();

        System.out.println("=== CMD-001 : client VIP, carte bancaire, e-mail ===");
        System.out.println("Total = " + processor.process(cmd001, "CREDIT_CARD", "EMAIL"));

        System.out.println("=== CMD-002 : client standard, PayPal, SMS ===");
        System.out.println("Total = " + processor.process(cmd002, "PAYPAL", "SMS"));

        System.out.println("=== CMD-003 : client standard, espèces, e-mail ===");
        System.out.println("Total = " + processor.process(cmd003, "CASH", "EMAIL"));

        System.out.println();
        System.out.println("=== Problème 1 : nouveau moyen de paiement CRYPTO ===");
        try {
            processor.process(cmd004, "CRYPTO", "EMAIL");
        } catch (IllegalArgumentException e) {
            System.out.println("Erreur : " + e);
            System.out.println("-> pour accepter CRYPTO, il faut modifier OrderProcessor.process().");
        }

        System.out.println("=== Problème 2 : nouveau canal de notification PUSH ===");
        processor.process(cmd004, "CREDIT_CARD", "PUSH");
        System.out.println("-> aucune notification envoyée et aucune erreur : le client n'est jamais prévenu.");

        System.out.println("=== Problème 3 : prélèvement mensuel des abonnés (CB, espèces, CB) ===");
        List<PaymentMethod> subscribers = List.of(new CreditCardPayment(), new CashPayment(), new CreditCardPayment());
        try {
            new SubscriptionBilling().chargeAll(subscribers, 9.9);
        } catch (UnsupportedOperationException e) {
            System.out.println("Erreur : " + e);
            System.out.println("-> la boucle s'arrête sur CashPayment : le 3e abonné n'est jamais prélevé.");
        }
    }
}
