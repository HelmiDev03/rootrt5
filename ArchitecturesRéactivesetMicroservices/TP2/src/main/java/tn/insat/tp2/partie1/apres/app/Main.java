package tn.insat.tp2.partie1.apres.app;

import java.util.List;

import tn.insat.tp2.partie1.apres.billing.CashPayment;
import tn.insat.tp2.partie1.apres.billing.CreditCardPayment;
import tn.insat.tp2.partie1.apres.billing.CryptoPayment;
import tn.insat.tp2.partie1.apres.billing.PaypalPayment;
import tn.insat.tp2.partie1.apres.billing.RecurringPayment;
import tn.insat.tp2.partie1.apres.billing.SubscriptionBilling;
import tn.insat.tp2.partie1.apres.billing.VipDiscountPolicy;
import tn.insat.tp2.partie1.apres.notifications.EmailNotifier;
import tn.insat.tp2.partie1.apres.notifications.PushNotifier;
import tn.insat.tp2.partie1.apres.notifications.SmsNotifier;
import tn.insat.tp2.partie1.apres.orders.CustomerType;
import tn.insat.tp2.partie1.apres.orders.DiscountPolicy;
import tn.insat.tp2.partie1.apres.orders.Item;
import tn.insat.tp2.partie1.apres.orders.Order;
import tn.insat.tp2.partie1.apres.orders.OrderProcessor;
import tn.insat.tp2.partie1.apres.orders.OrderRepository;
import tn.insat.tp2.partie1.apres.persistence.MySqlOrderRepository;

/**
 * Point d'assemblage (composition root) : le seul endroit qui connaît les classes concrètes
 * et qui les injecte dans OrderProcessor.
 * CMD-001 à CMD-003 sont les commandes du Main « avant » : la sortie doit rester identique.
 */
public class Main {

    public static void main(String[] args) {
        Order cmd001 = new Order("CMD-001", CustomerType.VIP, "amira@shopflow.tn", "+216 20 111 222",
                List.of(new Item("Laptop", 1200.0, 1), new Item("Souris", 25.0, 2)));
        Order cmd002 = new Order("CMD-002", CustomerType.STANDARD, "youssef@shopflow.tn", "+216 50 333 444",
                List.of(new Item("Livre Clean Code", 45.0, 2), new Item("Clavier", 60.0, 1)));
        Order cmd003 = new Order("CMD-003", CustomerType.STANDARD, "salma@shopflow.tn", "+216 98 555 666",
                List.of(new Item("Casque", 80.0, 1)));
        Order cmd004 = new Order("CMD-004", CustomerType.VIP, "karim@shopflow.tn", "+216 22 777 888",
                List.of(new Item("Écran", 300.0, 2)));

        DiscountPolicy discount = new VipDiscountPolicy();
        OrderRepository repository = new MySqlOrderRepository("jdbc:mysql://localhost/shop");

        System.out.println("=== CMD-001 : client VIP, carte bancaire, e-mail ===");
        OrderProcessor cardEmail = new OrderProcessor(discount, new CreditCardPayment(), repository, new EmailNotifier());
        System.out.println("Total = " + cardEmail.process(cmd001));

        System.out.println("=== CMD-002 : client standard, PayPal, SMS ===");
        OrderProcessor paypalSms = new OrderProcessor(discount, new PaypalPayment(), repository, new SmsNotifier());
        System.out.println("Total = " + paypalSms.process(cmd002));

        System.out.println("=== CMD-003 : client standard, espèces, e-mail ===");
        OrderProcessor cashEmail = new OrderProcessor(discount, new CashPayment(), repository, new EmailNotifier());
        System.out.println("Total = " + cashEmail.process(cmd003));

        // 1.4 : deux nouvelles classes, branchées ici. OrderProcessor n'a pas changé.
        System.out.println();
        System.out.println("=== 1.4 : CMD-004, paiement CRYPTO et notification PUSH ===");
        OrderProcessor cryptoPush = new OrderProcessor(discount, new CryptoPayment(), repository, new PushNotifier());
        System.out.println("Total = " + cryptoPush.process(cmd004));

        // Abonnements : SubscriptionBilling n'accepte que des RecurringPayment.
        // List.of(new CreditCardPayment(), new CashPayment()) ne compile plus ici (voir 1.3).
        System.out.println("=== Abonnements : prélèvement mensuel (CB, PayPal) ===");
        List<RecurringPayment> subscribers = List.of(new CreditCardPayment(), new PaypalPayment());
        new SubscriptionBilling().chargeAll(subscribers, 9.9);
    }
}
