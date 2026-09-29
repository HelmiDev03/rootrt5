package tn.insat.tp1.partie5;

/**
 * Partie 5 - Étape 1 : abstraction commune aux éléments du catalogue.
 * Rôle dans le pattern Composite : Component.
 * <p>
 * Un produit et une catégorie ont tous les deux cette méthode : le code client
 * peut donc les traiter de la même façon, sans savoir lequel des deux il manipule.
 */
public interface CatalogComponent {

    // indent : les espaces à écrire avant la ligne. Ils augmentent à chaque niveau de l'arbre.
    void display(String indent);
}
