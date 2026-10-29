package tn.insat.tp2.partie1.avant;

/** Ajoutée pour la démonstration : un moyen de paiement qui sait tout faire, abonnements compris. */
public class CreditCardPayment implements PaymentMethod {
    public void pay(double a)             { System.out.println("Débit CB : " + a); }
    public void refund(double a)          { System.out.println("Remboursement CB : " + a); }
    public void recurringCharge(double a) { System.out.println("Prélèvement mensuel CB : " + a); }
}
