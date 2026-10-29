package tn.insat.tp2.partie1.apres.billing;

import java.util.List;

/**
 * Module abonnements : prélève chaque mois tous les abonnés.
 * Il ne reçoit que des RecurringPayment : un paiement en espèces ne peut plus lui être passé.
 */
public class SubscriptionBilling {

    public void chargeAll(List<RecurringPayment> subscribers, double monthlyFee) {
        for (RecurringPayment subscriber : subscribers) {
            subscriber.recurringCharge(monthlyFee);
        }
    }
}
