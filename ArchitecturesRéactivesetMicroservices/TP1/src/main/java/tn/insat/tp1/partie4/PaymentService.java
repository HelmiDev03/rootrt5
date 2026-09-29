package tn.insat.tp1.partie4;

/**
 * Partie 4 : interface attendue par le client (donnée par l'énoncé).
 * Rôle dans le pattern Adapter : Target (la « cible »).
 */
public interface PaymentService {

    void pay(double amount);
}
