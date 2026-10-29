package tn.insat.tp2.partie1.avant;

/** Accès MySQL, simulé : affiche l'enregistrement au lieu de l'écrire en base. */
public class MySqlDatabase {

    private final String url;

    public MySqlDatabase(String url) {
        this.url = url;
    }

    public void save(Order order, double total) {
        System.out.println("MySQL (" + url + ") : commande " + order.getId() + " enregistrée, total = " + total);
    }
}
