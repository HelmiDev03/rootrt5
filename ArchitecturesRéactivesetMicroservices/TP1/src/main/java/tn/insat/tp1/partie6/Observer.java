package tn.insat.tp1.partie6;

/**
 * Partie 6 - Étape 6 : abstraction Observer (pattern Observer).
 * <p>
 * Tout composant qui veut être prévenu quand une commande change d'état
 * implémente cette interface.
 */
public interface Observer {

    // Appelée par le sujet, avec le nouvel état de la commande.
    void update(String status);
}
