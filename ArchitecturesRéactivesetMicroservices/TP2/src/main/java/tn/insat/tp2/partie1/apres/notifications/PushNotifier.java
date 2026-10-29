package tn.insat.tp2.partie1.apres.notifications;

import tn.insat.tp2.partie1.apres.orders.Notifier;
import tn.insat.tp2.partie1.apres.orders.Order;

/** Ajouté en 1.4 : notification push sur l'application mobile. OrderProcessor n'est pas modifié (OCP). */
public class PushNotifier implements Notifier {

    @Override
    public void send(Order order, String message) {
        System.out.println("Notification push à " + order.getEmail() + " : " + message);
    }
}
