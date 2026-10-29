package tn.insat.tp2.partie1.avant;

import java.util.List;

/**
 * Code client existant (module abonnements) : prélève chaque mois tous les abonnés.
 * Il est écrit pour l'interface PaymentMethod : il fait confiance à son contrat.
 */
public class SubscriptionBilling {

    public void chargeAll(List<PaymentMethod> subscribers, double monthlyFee) {
        for (PaymentMethod method : subscribers) {
            method.recurringCharge(monthlyFee);
        }
    }
}
