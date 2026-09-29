package tn.insat.tp1.partie2;

/** Partie 2 - Étape 2 : produit concret « vêtement ». */
public class Clothing implements Product {

    private final String name;
    private final double price;

    public Clothing(String name, double price) {
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
        System.out.println("Clothing : " + name + " - " + price + " DT");
    }
}
