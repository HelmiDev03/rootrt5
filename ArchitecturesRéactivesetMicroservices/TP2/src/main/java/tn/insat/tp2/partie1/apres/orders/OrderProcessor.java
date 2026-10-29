package tn.insat.tp2.partie1.apres.orders;

/**
 * Valide une commande. Sa seule responsabilité : enchaîner les étapes (SRP).
 * Chaque étape est déléguée à une abstraction reçue par le constructeur (DIP) :
 * un nouveau moyen de paiement ou un nouveau canal ne change rien ici (OCP).
 */
public class OrderProcessor {

    private final DiscountPolicy discountPolicy;
    private final PaymentMethod paymentMethod;
    private final OrderRepository orderRepository;
    private final Notifier notifier;

    public OrderProcessor(DiscountPolicy discountPolicy, PaymentMethod paymentMethod,
                          OrderRepository orderRepository, Notifier notifier) {
        this.discountPolicy = discountPolicy;
        this.paymentMethod = paymentMethod;
        this.orderRepository = orderRepository;
        this.notifier = notifier;
    }

    public double process(Order order) {
        double total = discountPolicy.apply(order, order.subtotal());
        paymentMethod.pay(total);
        orderRepository.save(order, total);
        notifier.send(order, "Commande validée");
        return total;
    }
}
