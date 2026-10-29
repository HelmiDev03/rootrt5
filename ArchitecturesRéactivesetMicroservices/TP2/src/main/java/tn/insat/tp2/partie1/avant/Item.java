package tn.insat.tp2.partie1.avant;

/** Ligne de commande : classe minimale pour que le code de l'énoncé compile. */
public class Item {

    private final String name;
    private final double price;
    private final int qty;

    public Item(String name, double price, int qty) {
        this.name = name;
        this.price = price;
        this.qty = qty;
    }

    public String getName() { return name; }
    public double getPrice() { return price; }
    public int getQty() { return qty; }
}
