package tn.insat.tp1.partie4;

/**
 * Partie 4 - Étape 1 : classe intermédiaire (pattern Adapter).
 * <p>
 * Elle a la forme attendue par le client (implements PaymentService)
 * et, à l'intérieur, elle appelle l'ancien système.
 */
public class PaymentAdapter implements PaymentService {

    // L'ancien système est gardé à l'intérieur de l'adaptateur (composition).
    private final OldPaymentSystem oldPaymentSystem;

    public PaymentAdapter(OldPaymentSystem oldPaymentSystem) {
        this.oldPaymentSystem = oldPaymentSystem;
    }

    @Override
    public void pay(double amount) {
        // Traduction : pay(...) côté client  ->  makePayment(...) côté ancien système
        oldPaymentSystem.makePayment(amount);
    }
}
