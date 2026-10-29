package tn.insat.tp2.partie1.apres.orders;

/** Abstraction : la règle de remise appliquée au sous-total d'une commande. */
public interface DiscountPolicy {
    double apply(Order order, double subtotal);
}
