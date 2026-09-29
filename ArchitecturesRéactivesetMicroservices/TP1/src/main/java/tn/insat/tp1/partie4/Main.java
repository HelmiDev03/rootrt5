package tn.insat.tp1.partie4;

/**
 * Partie 4 - Étape 3 : test d'un paiement de 250 (code de l'énoncé).
 */
public class Main {

    public static void main(String[] args) {
        PaymentService payment = new PaymentAdapter(new OldPaymentSystem());
        payment.pay(250);
    }
}
