package tn.insat.tp1.partie2;

/** Partie 2 - Étape 5 : nouveau produit « alimentation », ajouté sans modifier OrderService. */
public class Food implements Product {

    private final String name;
    private final double price;

    public Food(String name, double price) {
        this.name = name;
        this.price = price;
    }

    @Override
    public String getName() {
        return name;
    }

    @Override
    public double getPrice() {
        return price;
    }

    @Override
    public void display() {
        System.out.println("Food : " + name + " - " + price + " DT");
    }
}
