package tn.insat.tp1.partie6;

import java.util.ArrayList;
import java.util.List;

/**
 * Partie 6 - Étapes 8 et 10 : la commande est le sujet observé.
 * <p>
 * Elle garde une liste d'observateurs, mais ne connaît que l'interface Observer :
 * il n'y a aucune trace de EmailService, StockService ou LoggerService dans cette classe.
 */
public class Order implements Subject {

    private String status = "CREATED";

    // La liste des abonnés : n'importe quel objet qui implémente Observer.
    private final List<Observer> observers = new ArrayList<>();

    @Override
    public void attach(Observer observer) {
        observers.add(observer);
    }

    @Override
    public void detach(Observer observer) {
        observers.remove(observer);
    }

    @Override
    public void notifyObservers() {
        // On prévient chaque observateur, un par un, avec le nouvel état.
        for (Observer observer : observers) {
            observer.update(status);
        }
    }

    // Étape 10 : changer l'état déclenche automatiquement la notification.
    public void setStatus(String status) {
        this.status = status;
        notifyObservers();
    }

    public String getStatus() {
        return status;
    }
}
