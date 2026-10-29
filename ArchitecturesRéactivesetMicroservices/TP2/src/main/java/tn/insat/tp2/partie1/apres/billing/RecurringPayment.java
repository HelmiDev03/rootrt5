package tn.insat.tp2.partie1.apres.billing;

/**
 * Prélèvement d'un abonnement. Son client : SubscriptionBilling.
 * Seuls les moyens qui savent le faire l'implémentent (CB, PayPal) : plus d'exception « non supporté ».
 */
public interface RecurringPayment {
    void recurringCharge(double amount);
}
