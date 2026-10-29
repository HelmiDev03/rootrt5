package tn.insat.tp2.partie1.apres.orders;

/** Abstraction : enregistrer une commande validée, sans dire où ni comment. */
public interface OrderRepository {
    void save(Order order, double total);
}
