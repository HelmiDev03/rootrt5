package tn.insat.tp1.partie2;

/**
 * Partie 2 - Étape 3 : classe responsable de la création des produits (pattern Factory).
 * <p>
 * C'est le SEUL endroit du programme qui sait quelle classe instancier pour chaque type.
 */
public class ProductFactory {

    private ProductFactory() {
        // pas d'instance : on utilise directement ProductFactory.createProduct(...)
    }

    public static Product createProduct(String type, String name, double price) {
        switch (type.toUpperCase()) {
            case "BOOK":
                return new Book(name, price);
            case "ELECTRONIC":
                return new Electronic(name, price);
            case "CLOTHING":
                return new Clothing(name, price);
            case "FOOD":                              // Étape 5 : seul ajout nécessaire pour Food
                return new Food(name, price);
            default:
                throw new IllegalArgumentException("Unknown product type: " + type);
        }
    }
}
