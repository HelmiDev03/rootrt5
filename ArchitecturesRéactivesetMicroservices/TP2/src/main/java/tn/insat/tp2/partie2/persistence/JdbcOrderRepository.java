package tn.insat.tp2.partie2.persistence;

import tn.insat.tp2.partie2.orders.Order;
import tn.insat.tp2.partie2.orders.OrderRepository;

/** Stockage JDBC des commandes (simulé par un affichage) : implémente l'interface de orders. */
public class JdbcOrderRepository implements OrderRepository {

    @Override
    public void save(Order order) {
        System.out.println("persistence : INSERT INTO orders, commande " + order.getId());
    }
}
