package tn.insat.tp2.partie1.apres.orders;

import java.util.List;

/** Commande : les données du client et les articles. Elle sait calculer son sous-total. */
public class Order {

    private final String id;
    private final CustomerType customerType;
    private final String email;
    private final String phone;
    private final List<Item> items;

    public Order(String id, CustomerType customerType, String email, String phone, List<Item> items) {
        this.id = id;
        this.customerType = customerType;
        this.email = email;
        this.phone = phone;
        this.items = List.copyOf(items);
    }

    public String getId() { return id; }
    public CustomerType getCustomerType() { return customerType; }
    public String getEmail() { return email; }
    public String getPhone() { return phone; }
    public List<Item> getItems() { return items; }

    /** Somme prix × quantité, avant remise. */
    public double subtotal() {
        double subtotal = 0;
        for (Item item : items) {
            subtotal += item.total();
        }
        return subtotal;
    }
}
