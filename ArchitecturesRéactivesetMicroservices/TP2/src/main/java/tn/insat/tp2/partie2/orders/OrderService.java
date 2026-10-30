package tn.insat.tp2.partie2.orders;

/**
 * Cœur métier : passer une commande.
 * Il n'utilise que les interfaces de son propre package : aucun import de billing ni de persistence.
 */
public class OrderService {

    private final PaymentMethod paymentMethod;
    private final OrderRepository orderRepository;

    public OrderService(PaymentMethod paymentMethod, OrderRepository orderRepository) {
        this.paymentMethod = paymentMethod;
        this.orderRepository = orderRepository;
    }

    public void place(Order order) {
        paymentMethod.pay(order);
        orderRepository.save(order);
    }
}
