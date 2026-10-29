package tn.insat.tp2.partie1.apres.persistence;

import tn.insat.tp2.partie1.apres.orders.Order;
import tn.insat.tp2.partie1.apres.orders.OrderRepository;

/** Enregistrement MySQL (simulé par un affichage). L'URL vient de l'assemblage, plus du code métier. */
public class MySqlOrderRepository implements OrderRepository {

    private final String url;

    public MySqlOrderRepository(String url) {
        this.url = url;
    }

    @Override
    public void save(Order order, double total) {
        System.out.println("MySQL (" + url + ") : commande " + order.getId() + " enregistrée, total = " + total);
    }
}
