package tn.insat.tp1.partie3;

/**
 * Partie 3 - Étape 3 : vérification expérimentale que c1 et c2 sont le même objet.
 */
public class Main {

    public static void main(String[] args) {
        ApplicationConfig c1 = ApplicationConfig.getInstance();
        ApplicationConfig c2 = ApplicationConfig.getInstance();

        System.out.println(c1 == c2);

        // Preuve supplémentaire : une valeur écrite via c1 se lit via c2.
        c1.setApplicationName("INSAT Shop");
        System.out.println(c2.getApplicationName());

        // new ApplicationConfig();  // ne compile plus : le constructeur est privé
    }
}
