package tn.insat.tp2.partie2;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

/** Calcule les métriques de la partie 2 pour l'architecture actuelle de ShopFlow et pour le graphe corrigé. */
public class Main {

    public static void main(String[] args) {
        // Tableau de l'énoncé : package, Nc, Na, dépend de.
        Architecture actuelle = new Architecture("Architecture actuelle (énoncé)")
                .add("ui", 12, 0, "orders", "notifications")
                .add("orders", 10, 2, "billing", "persistence")
                .add("billing", 8, 1, "orders", "persistence")
                .add("notifications", 6, 0, "orders")
                .add("persistence", 9, 0);

        // Graphe corrigé (2.2.4), DIP appliqué aux flèches qui posent problème :
        //  - orders possède PaymentMethod, implémentée par billing      -> le cycle orders <-> billing disparaît ;
        //  - orders possède OrderRepository et billing InvoiceRepository,
        //    implémentées par persistence                              -> persistence quitte la zone de douleur.
        // orders : 10 + 2 interfaces = 12 classes dont 4 abstraites ; billing : 8 + 1 = 9 dont 2 abstraites.
        Architecture corrigee = new Architecture("Architecture corrigée (2.2.4)")
                .add("ui", 12, 0, "orders", "notifications")
                .add("orders", 12, 4)
                .add("billing", 9, 2, "orders")
                .add("notifications", 6, 0, "orders")
                .add("persistence", 9, 0, "orders", "billing");

        print(actuelle);
        System.out.println();
        print(corrigee);
        System.out.println();

        // Contrôle : le point d'assemblage (le Main qui fait les new) compté comme un 6e package « app ».
        Architecture avecApp = new Architecture("Contrôle : graphe corrigé + point d'assemblage app")
                .add("app", 1, 0, "ui", "orders", "billing", "notifications", "persistence")
                .add("ui", 12, 0, "orders", "notifications")
                .add("orders", 12, 4)
                .add("billing", 9, 2, "orders")
                .add("notifications", 6, 0, "orders")
                .add("persistence", 9, 0, "orders", "billing");
        System.out.println("=== " + avecApp.title() + " ===");
        printChecks(avecApp);
    }

    private static void print(Architecture arch) {
        System.out.println("=== " + arch.title() + " ===");
        System.out.println(String.format("%-14s%3s%4s%4s%4s  %-15s%-13s%-6s%s",
                "Package", "Nc", "Na", "Ca", "Ce", "I = Ce/(Ca+Ce)", "A = Na/Nc", "D", "Position"));
        for (String pkg : arch.packages()) {
            int ca = arch.ca(pkg);
            int ce = arch.ce(pkg);
            String i = ce + "/" + (ca + ce) + " = " + fr(arch.instability(pkg));
            String a = arch.na(pkg) + "/" + arch.nc(pkg) + " = " + fr(arch.abstractness(pkg));
            System.out.println(String.format("%-14s%3d%4d%4d%4d  %-15s%-13s%-6s%s",
                    pkg, arch.nc(pkg), arch.na(pkg), ca, ce, i, a, fr(arch.distance(pkg)), arch.position(pkg)));
        }
        System.out.println("D moyen = " + fr(arch.meanDistance()));
        System.out.println("Flèches (SDP : la cible doit être plus stable, donc I plus petit) :");
        for (String from : arch.packages()) {
            for (String to : arch.dependsOn(from)) {
                String edge = from + " (" + fr(arch.instability(from)) + ") → " + to + " (" + fr(arch.instability(to)) + ")";
                System.out.println(String.format("  %-38s %s", edge, arch.violatesSdp(from, to) ? "VIOLATION SDP" : "ok"));
            }
        }
        printChecks(arch);
        List<String> pain = new ArrayList<>();
        for (String pkg : arch.packages()) {
            if (arch.position(pkg).equals("zone de douleur")) {
                pain.add(pkg);
            }
        }
        System.out.println("SAP, zone de douleur (I = 0 et A = 0) : " + (pain.isEmpty() ? "aucun package" : String.join(", ", pain)));
    }

    private static void printChecks(Architecture arch) {
        List<String> cycles = new ArrayList<>();
        for (List<String> cycle : arch.cycles()) {
            cycles.add(String.join(" → ", cycle));
        }
        int violations = 0;
        for (String from : arch.packages()) {
            for (String to : arch.dependsOn(from)) {
                if (arch.violatesSdp(from, to)) {
                    violations++;
                }
            }
        }
        System.out.println("ADP, cycles : " + (cycles.isEmpty() ? "aucun" : String.join(" ; ", cycles)));
        System.out.println("SDP, flèches vers un package moins stable : " + violations);
    }

    private static String fr(double value) {
        return String.format(Locale.FRANCE, "%.2f", value);
    }
}
