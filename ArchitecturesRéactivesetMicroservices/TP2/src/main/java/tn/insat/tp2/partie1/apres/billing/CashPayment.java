package tn.insat.tp2.partie1.apres.billing;

import tn.insat.tp2.partie1.apres.orders.PaymentMethod;

/** Espèces : paiement ponctuel seulement. Elle n'implémente plus de méthode qu'elle ne sait pas faire. */
public class CashPayment implements PaymentMethod {

    @Override
    public void pay(double amount) {
        System.out.println("Espèces : " + amount);
    }

    @Override
    public void refund(double amount) {
        System.out.println("Remboursement en espèces : " + amount);
    }
}
