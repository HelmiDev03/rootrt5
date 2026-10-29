package tn.insat.tp2.partie1.apres.orders;

/**
 * Abstraction : paiement ponctuel d'une commande (encaisser, puis rembourser en cas d'annulation ou de retour).
 * Tous les moyens de paiement savent le faire.
 * Le prélèvement d'abonnement n'est plus ici : il est dans RecurringPayment (ISP).
 */
public interface PaymentMethod {
    void pay(double amount);
    void refund(double amount);
}
