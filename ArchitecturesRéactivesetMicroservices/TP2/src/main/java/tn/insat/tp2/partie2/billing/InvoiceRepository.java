package tn.insat.tp2.partie2.billing;

/**
 * Interface possédée par billing, implémentée par persistence (DIP).
 * La flèche billing → persistence s'inverse : c'est persistence qui dépend de billing.
 */
public interface InvoiceRepository {
    void save(Invoice invoice);
}
