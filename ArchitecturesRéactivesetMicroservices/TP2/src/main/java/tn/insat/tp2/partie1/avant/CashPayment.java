package tn.insat.tp2.partie1.avant;

// Code existant de l'énoncé, recopié tel quel.
public class CashPayment implements PaymentMethod {
    public void pay(double a)             { /* encaissement */ }
    public void refund(double a)          { /* remboursement */ }
    public void recurringCharge(double a) { throw new UnsupportedOperationException(); }
}
