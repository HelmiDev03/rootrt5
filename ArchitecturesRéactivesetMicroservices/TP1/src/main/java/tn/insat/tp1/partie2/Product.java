package tn.insat.tp1.partie2;

/**
 * Partie 2 - Étape 1 : interface commune à tous les produits.
 * <p>
 * Elle dit CE QUE tout produit sait faire, sans dire COMMENT.
 * Le code client (OrderService) ne manipulera que ce type, jamais Book, Electronic ou Clothing.
 */
public interface Product {

    String getName();

    double getPrice();

    /** Affiche le produit. Chaque classe concrète décide de son propre affichage. */
    void display();
}
