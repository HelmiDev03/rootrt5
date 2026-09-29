package tn.insat.tp1.partie6;

/**
 * Partie 6 - Étape 7 : abstraction Subject (le « sujet observé »).
 * <p>
 * Un sujet permet d'ajouter, de supprimer et de notifier ses observateurs.
 */
public interface Subject {

    // Ajouter un observateur (il s'abonne).
    void attach(Observer observer);

    // Supprimer un observateur (il se désabonne).
    void detach(Observer observer);

    // Prévenir tous les observateurs.
    void notifyObservers();
}
