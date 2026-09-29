package tn.insat.tp1.partie5;

import java.util.ArrayList;
import java.util.List;

/**
 * Partie 5 - Étapes 3, 4 et 5 : une catégorie, composée de plusieurs éléments.
 * Rôle dans le pattern Composite : Composite.
 * <p>
 * Ses enfants sont des CatalogComponent : des produits et/ou d'autres catégories.
 */
public class Category implements CatalogComponent {

    private final String name;

    // Étape 4 : la liste accepte tout CatalogComponent, donc des produits ET des catégories.
    private final List<CatalogComponent> children = new ArrayList<>();

    public Category(String name) {
        this.name = name;
    }

    public void add(CatalogComponent component) {
        children.add(component);
    }

    public void remove(CatalogComponent component) {
        children.remove(component);
    }

    // Étape 5 : afficher la catégorie, puis demander à chaque enfant de s'afficher
    // avec 4 espaces de plus (un niveau plus bas dans l'arbre).
    @Override
    public void display(String indent) {
        System.out.println(indent + "+ " + name);
        for (CatalogComponent child : children) {
            child.display(indent + "    ");
        }
    }
}
