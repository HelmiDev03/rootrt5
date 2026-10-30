package tn.insat.tp2.partie2.billing;

import tn.insat.tp2.partie2.orders.Order;
import tn.insat.tp2.partie2.orders.PaymentMethod;

/** Paiement par carte : implémente l'interface de orders. C'est la seule flèche entre billing et orders. */
public class CardPayment implements PaymentMethod {

    private final InvoiceRepository invoices;

    public CardPayment(InvoiceRepository invoices) {
        this.invoices = invoices;
    }

    @Override
    public void pay(Order order) {
        System.out.println("billing : débit carte de " + order.getAmount() + " pour " + order.getId());
        invoices.save(new Invoice(order.getId(), order.getAmount()));
    }
}
