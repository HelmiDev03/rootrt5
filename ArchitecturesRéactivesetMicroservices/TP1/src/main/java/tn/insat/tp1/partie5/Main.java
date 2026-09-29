package tn.insat.tp1.partie5;

/**
 * Partie 5 - Étape 6 : construction du catalogue de l'énoncé et test de l'affichage.
 */
public class Main {

    public static void main(String[] args) {
        // Les catégories qui contiennent des produits
        Category books = new Category("Books");
        books.add(new Product("Book 1", 45.0));
        books.add(new Product("Book 2", 38.5));

        Category electronics = new Category("Electronics");
        electronics.add(new Product("Laptop", 2500.0));
        electronics.add(new Product("Smartphone", 1200.0));

        Category clothing = new Category("Clothing");
        clothing.add(new Product("Shirt", 60.0));
        clothing.add(new Product("Jacket", 180.0));

        // Étape 4 : le catalogue est une catégorie qui contient d'autres catégories
        Category catalogue = new Category("Catalogue");
        catalogue.add(books);
        catalogue.add(electronics);
        catalogue.add(clothing);

        // Étape 6 : afficher tout l'arbre à partir de l'objet Catalogue
        catalogue.display("");
    }
}
