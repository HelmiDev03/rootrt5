package tn.insat.tp2.partie1.apres.billing;

import tn.insat.tp2.partie1.apres.orders.PaymentMethod;

/** Carte bancaire : paiement ponctuel et prélèvement d'abonnement. */
public class CreditCardPayment implements PaymentMethod, RecurringPayment {

    @Override
    public void pay(double amount) {
        System.out.println("Débit CB : " + amount);
    }

    @Override
    public void refund(double amount) {
        System.out.println("Remboursement CB : " + amount);
    }

    @Override
    public void recurringCharge(double amount) {
        System.out.println("Prélèvement mensuel CB : " + amount);
    }
}
