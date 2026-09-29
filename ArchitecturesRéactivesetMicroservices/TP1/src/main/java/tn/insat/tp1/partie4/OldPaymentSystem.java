package tn.insat.tp1.partie4;

/**
 * Partie 4 : ancien système de paiement (donné par l'énoncé), NON modifié.
 * Rôle dans le pattern Adapter : Adaptee (la classe « à adapter »).
 * Sa méthode makePayment() ne correspond pas à pay() attendue par le client.
 */
public class OldPaymentSystem {

    public void makePayment(double value) {
        System.out.println("Payment : " + value);
    }
}
