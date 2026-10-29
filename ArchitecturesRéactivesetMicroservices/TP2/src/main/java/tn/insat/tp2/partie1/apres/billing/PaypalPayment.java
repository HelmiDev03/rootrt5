package tn.insat.tp2.partie1.apres.billing;

import tn.insat.tp2.partie1.apres.orders.PaymentMethod;

/** PayPal : paiement ponctuel et prélèvement d'abonnement. */
public class PaypalPayment implements PaymentMethod, RecurringPayment {

    @Override
    public void pay(double amount) {
        System.out.println("PayPal : " + amount);
    }

    @Override
    public void refund(double amount) {
        System.out.println("Remboursement PayPal : " + amount);
    }

    @Override
    public void recurringCharge(double amount) {
        System.out.println("Prélèvement mensuel PayPal : " + amount);
    }
}
