package tn.insat.tp2.partie2.orders;

/**
 * Interface possédée par orders, implémentée par persistence (DIP).
 * La flèche orders → persistence s'inverse : c'est persistence qui dépend de orders.
 */
public interface OrderRepository {
    void save(Order order);
}
