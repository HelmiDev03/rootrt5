package tn.insat.tp1.partie2;

/** Partie 2 - Étape 2 : produit concret « livre ». */
public class Book implements Product {

    private final String name;
    private final double price;

    public Book(String name, double price) {
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
        System.out.println("Book : " + name + " - " + price + " DT");
    }
}
