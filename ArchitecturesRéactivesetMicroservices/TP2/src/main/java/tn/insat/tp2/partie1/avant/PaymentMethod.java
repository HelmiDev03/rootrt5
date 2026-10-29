package tn.insat.tp2.partie1.avant;

// Code existant de l'énoncé, recopié tel quel.
public interface PaymentMethod {
    void pay(double amount);
    void refund(double amount);
    void recurringCharge(double amount);   // abonnements
}
