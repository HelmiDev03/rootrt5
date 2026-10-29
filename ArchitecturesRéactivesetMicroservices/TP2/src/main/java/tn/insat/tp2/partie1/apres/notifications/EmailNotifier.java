package tn.insat.tp2.partie1.apres.notifications;

import tn.insat.tp2.partie1.apres.orders.Notifier;
import tn.insat.tp2.partie1.apres.orders.Order;

/** Notification par e-mail (envoi SMTP simulé par un affichage). */
public class EmailNotifier implements Notifier {

    @Override
    public void send(Order order, String message) {
        System.out.println("E-mail à " + order.getEmail() + " : " + message);
    }
}
