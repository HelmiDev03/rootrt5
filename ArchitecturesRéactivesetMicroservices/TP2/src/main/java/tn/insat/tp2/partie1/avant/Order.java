package tn.insat.tp2.partie1.avant;

import java.util.List;

/** Commande : classe minimale pour que le code de l'énoncé compile. */
public class Order {

    private final String id;
    private final String customerType;   // "VIP" ou "STANDARD"
    private final String email;
    private final String phone;
    private final List<Item> items;

    public Order(String id, String customerType, String email, String phone, List<Item> items) {
        this.id = id;
        this.customerType = customerType;
        this.email = email;
        this.phone = phone;
        this.items = items;
    }

    public String getId() { return id; }
    public String getCustomerType() { return customerType; }
    public String getEmail() { return email; }
    public String getPhone() { return phone; }
    public List<Item> getItems() { return items; }
}
