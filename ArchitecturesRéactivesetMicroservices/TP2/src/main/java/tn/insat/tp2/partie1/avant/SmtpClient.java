package tn.insat.tp2.partie1.avant;

/** Client SMTP, simulé : affiche l'e-mail au lieu de l'envoyer. */
public class SmtpClient {

    public void send(String email, String message) {
        System.out.println("E-mail à " + email + " : " + message);
    }
}
