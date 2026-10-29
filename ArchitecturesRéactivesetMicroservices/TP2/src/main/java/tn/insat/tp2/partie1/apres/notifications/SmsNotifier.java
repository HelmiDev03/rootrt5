package tn.insat.tp2.partie1.apres.notifications;

import tn.insat.tp2.partie1.apres.orders.Notifier;
import tn.insat.tp2.partie1.apres.orders.Order;

/** Notification par SMS (passerelle simulée par un affichage). */
public class SmsNotifier implements Notifier {

    @Override
    public void send(Order order, String message) {
        System.out.println("SMS au " + order.getPhone() + " : " + message);
    }
}
