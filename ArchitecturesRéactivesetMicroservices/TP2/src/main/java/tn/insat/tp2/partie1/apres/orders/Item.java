package tn.insat.tp2.partie1.apres.orders;

/** Ligne de commande : un article, son prix unitaire et la quantité. */
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

    public double total() {
        return price * qty;
    }
}
