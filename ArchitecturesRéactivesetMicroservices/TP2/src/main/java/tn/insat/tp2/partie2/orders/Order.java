package tn.insat.tp2.partie2.orders;

/** Commande : entité du cœur métier. */
public class Order {

    private final String id;
    private final String email;
    private final double amount;

    public Order(String id, String email, double amount) {
        this.id = id;
        this.email = email;
        this.amount = amount;
    }

    public String getId() {
        return id;
    }

    public String getEmail() {
        return email;
    }

    public double getAmount() {
        return amount;
    }
}
