package tn.insat.tp2.partie1.avant;

// Code existant de l'énoncé, recopié tel quel.
public class OrderProcessor {
    public double process(Order order, String paymentType, String notifType) {
        double total = 0;
        for (Item i : order.getItems()) total += i.getPrice() * i.getQty();
        if (order.getCustomerType().equals("VIP")) total *= 0.9;

        switch (paymentType) {
            case "CREDIT_CARD": System.out.println("Débit CB : " + total); break;
            case "PAYPAL":      System.out.println("PayPal : " + total);   break;
            case "CASH":        System.out.println("Espèces : " + total);  break;
            default: throw new IllegalArgumentException(paymentType);
        }

        MySqlDatabase db = new MySqlDatabase("jdbc:mysql://localhost/shop");
        db.save(order, total);

        if (notifType.equals("EMAIL"))
            new SmtpClient().send(order.getEmail(), "Commande validée");
        else if (notifType.equals("SMS"))
            new SmsGateway().send(order.getPhone(), "Commande validée");
        return total;
    }
}
