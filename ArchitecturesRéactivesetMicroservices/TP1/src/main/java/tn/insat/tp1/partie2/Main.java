package tn.insat.tp1.partie2;

/**
 * Partie 2 - Étape 6 : tester plusieurs créations de produits.
 */
public class Main {

    public static void main(String[] args) {
        // Exemple d'utilisation attendu (énoncé)
        Product p = ProductFactory.createProduct("BOOK", "Design Patterns", 45);
        p.display();

        // Plusieurs créations, dont le nouveau produit Food (étape 5)
        ProductFactory.createProduct("ELECTRONIC", "Laptop", 2500).display();
        ProductFactory.createProduct("CLOTHING", "Jacket", 180).display();
        ProductFactory.createProduct("FOOD", "Dates", 12.5).display();

        // OrderService n'a pas été modifié, et il accepte pourtant Food
        OrderService orderService = new OrderService();
        orderService.createOrder("BOOK", "Design Patterns", 45);
        orderService.createOrder("FOOD", "Dates", 12.5);
    }
}
