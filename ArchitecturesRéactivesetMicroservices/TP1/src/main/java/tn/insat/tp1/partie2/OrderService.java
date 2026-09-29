package tn.insat.tp1.partie2;

/**
 * Partie 2 - Étape 4 : OrderService ne crée plus les produits lui-même.
 * <p>
 * Plus de {@code new}, plus de {@code if/else} : la création est déléguée à ProductFactory,
 * et OrderService ne connaît que l'interface Product.
 */
public class OrderService {

    public void createOrder(String type, String name, double price) {

        Product product = ProductFactory.createProduct(type, name, price);

        System.out.println("Order created for " + product.getName());
    }
}
