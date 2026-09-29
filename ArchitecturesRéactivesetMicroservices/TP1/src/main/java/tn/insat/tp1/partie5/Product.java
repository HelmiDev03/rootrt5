package tn.insat.tp1.partie5;

/**
 * Partie 5 - Étape 2 : un élément individuel du catalogue.
 * Rôle dans le pattern Composite : Leaf (feuille). Un produit n'a pas d'enfants.
 */
public class Product implements CatalogComponent {

    private final String name;
    private final double price;

    public Product(String name, double price) {
        this.name = name;
        this.price = price;
    }

    // Une feuille affiche une seule ligne : c'est là que la récursion s'arrête.
    @Override
    public void display(String indent) {
        System.out.println(indent + "- " + name + " (" + price + " DT)");
    }
}
