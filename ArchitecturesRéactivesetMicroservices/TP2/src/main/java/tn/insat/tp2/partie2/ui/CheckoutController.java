package tn.insat.tp2.partie2.ui;

import tn.insat.tp2.partie2.notifications.EmailNotifier;
import tn.insat.tp2.partie2.orders.Order;
import tn.insat.tp2.partie2.orders.OrderService;

/** Écran de validation de commande : utilise orders et notifications, comme dans le graphe de l'énoncé. */
public class CheckoutController {

    private final OrderService orderService;
    private final EmailNotifier notifier;

    public CheckoutController(OrderService orderService, EmailNotifier notifier) {
        this.orderService = orderService;
        this.notifier = notifier;
    }

    public void checkout(Order order) {
        System.out.println("ui : validation de la commande " + order.getId());
        orderService.place(order);
        notifier.orderConfirmed(order);
    }
}
