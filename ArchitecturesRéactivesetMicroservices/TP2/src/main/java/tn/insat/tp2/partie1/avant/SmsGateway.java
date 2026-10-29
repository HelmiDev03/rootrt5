package tn.insat.tp2.partie1.avant;

/** Passerelle SMS, simulée : affiche le SMS au lieu de l'envoyer. */
public class SmsGateway {

    public void send(String phone, String message) {
        System.out.println("SMS au " + phone + " : " + message);
    }
}
