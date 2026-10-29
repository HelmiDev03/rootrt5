package tn.insat.tp2.partie1.apres.orders;

/** Abstraction : prévenir le client, quel que soit le canal. */
public interface Notifier {
    void send(Order order, String message);
}
