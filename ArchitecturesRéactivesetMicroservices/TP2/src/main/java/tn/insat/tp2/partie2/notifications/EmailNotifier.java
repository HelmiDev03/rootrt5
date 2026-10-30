package tn.insat.tp2.partie2.notifications;

import tn.insat.tp2.partie2.orders.Order;

/** Notification par e-mail (simulée par un affichage). Elle lit une Order : flèche notifications → orders. */
public class EmailNotifier {

    public void orderConfirmed(Order order) {
        System.out.println("notifications : e-mail à " + order.getEmail() + ", commande " + order.getId() + " confirmée");
    }
}
