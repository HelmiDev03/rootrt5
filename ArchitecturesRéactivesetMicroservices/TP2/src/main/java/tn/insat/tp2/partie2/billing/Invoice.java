package tn.insat.tp2.partie2.billing;

/** Facture d'une commande payée. */
public class Invoice {

    private final String orderId;
    private final double amount;

    public Invoice(String orderId, double amount) {
        this.orderId = orderId;
        this.amount = amount;
    }

    public String getOrderId() {
        return orderId;
    }

    public double getAmount() {
        return amount;
    }
}
