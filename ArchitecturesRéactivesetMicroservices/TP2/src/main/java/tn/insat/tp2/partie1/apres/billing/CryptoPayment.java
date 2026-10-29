package tn.insat.tp2.partie1.apres.billing;

import tn.insat.tp2.partie1.apres.orders.PaymentMethod;

/** Ajouté en 1.4 : paiement en cryptomonnaie. Nouvelle classe, OrderProcessor n'est pas modifié (OCP). */
public class CryptoPayment implements PaymentMethod {

    @Override
    public void pay(double amount) {
        System.out.println("Crypto : " + amount);
    }

    @Override
    public void refund(double amount) {
        System.out.println("Remboursement crypto : " + amount);
    }
}
