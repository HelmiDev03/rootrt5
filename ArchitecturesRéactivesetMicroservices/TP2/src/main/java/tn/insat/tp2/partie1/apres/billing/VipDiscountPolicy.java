package tn.insat.tp2.partie1.apres.billing;

import tn.insat.tp2.partie1.apres.orders.CustomerType;
import tn.insat.tp2.partie1.apres.orders.DiscountPolicy;
import tn.insat.tp2.partie1.apres.orders.Order;

/** La règle de l'ancien code, isolée : 10 % de remise pour les clients VIP. */
public class VipDiscountPolicy implements DiscountPolicy {

    private static final double VIP_RATE = 0.10;

    @Override
    public double apply(Order order, double subtotal) {
        if (order.getCustomerType() == CustomerType.VIP) {
            return subtotal * (1 - VIP_RATE);
        }
        return subtotal;
    }
}
