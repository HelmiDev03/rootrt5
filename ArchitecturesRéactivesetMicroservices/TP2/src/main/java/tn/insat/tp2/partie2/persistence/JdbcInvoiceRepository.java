package tn.insat.tp2.partie2.persistence;

import tn.insat.tp2.partie2.billing.Invoice;
import tn.insat.tp2.partie2.billing.InvoiceRepository;

/** Stockage JDBC des factures (simulé par un affichage) : implémente l'interface de billing. */
public class JdbcInvoiceRepository implements InvoiceRepository {

    @Override
    public void save(Invoice invoice) {
        System.out.println("persistence : INSERT INTO invoices, facture de la commande " + invoice.getOrderId());
    }
}
