package tn.insat.tp2.partie2.app;

import tn.insat.tp2.partie2.billing.CardPayment;
import tn.insat.tp2.partie2.billing.InvoiceRepository;
import tn.insat.tp2.partie2.notifications.EmailNotifier;
import tn.insat.tp2.partie2.orders.Order;
import tn.insat.tp2.partie2.orders.OrderService;
import tn.insat.tp2.partie2.persistence.JdbcInvoiceRepository;
import tn.insat.tp2.partie2.persistence.JdbcOrderRepository;
import tn.insat.tp2.partie2.ui.CheckoutController;

/**
 * Point d'assemblage : le seul endroit qui fait les new et branche chaque implémentation sur son interface.
 * Il dépend des cinq packages, mais aucun ne dépend de lui : il ne peut pas créer de cycle.
 */
public class Main {

    public static void main(String[] args) {
        InvoiceRepository invoices = new JdbcInvoiceRepository();
        OrderService orderService = new OrderService(new CardPayment(invoices), new JdbcOrderRepository());
        CheckoutController checkout = new CheckoutController(orderService, new EmailNotifier());

        checkout.checkout(new Order("CMD-005", "amira@shopflow.tn", 120.0));
    }
}
