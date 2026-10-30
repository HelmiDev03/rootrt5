package tn.insat.tp2.partie2.orders;

/**
 * Interface possédée par orders, implémentée par billing (DIP).
 * orders n'importe plus rien de billing : la flèche orders → billing disparaît, et le cycle avec elle.
 */
public interface PaymentMethod {
    void pay(Order order);
}
