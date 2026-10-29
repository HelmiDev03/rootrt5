package tn.insat.tp2.partie2;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Graphe de packages : pour chaque package, Nc (nombre de classes), Na (classes abstraites et interfaces)
 * et les packages dont il dépend. Calcule les métriques de Robert C. Martin.
 * L'énoncé ne donne pas le détail par classe : chaque flèche entre deux packages compte pour 1 dans Ca et Ce.
 */
public class Architecture {

    private final String title;
    private final Map<String, Integer> nc = new LinkedHashMap<>();
    private final Map<String, Integer> na = new LinkedHashMap<>();
    private final Map<String, List<String>> dependsOn = new LinkedHashMap<>();

    public Architecture(String title) {
        this.title = title;
    }

    public Architecture add(String pkg, int nc, int na, String... dependsOn) {
        this.nc.put(pkg, nc);
        this.na.put(pkg, na);
        this.dependsOn.put(pkg, List.of(dependsOn));
        return this;
    }

    public String title() { return title; }
    public List<String> packages() { return new ArrayList<>(dependsOn.keySet()); }
    public List<String> dependsOn(String pkg) { return dependsOn.get(pkg); }
    public int nc(String pkg) { return nc.get(pkg); }
    public int na(String pkg) { return na.get(pkg); }

    /** Ca (couplage afférent) : nombre de packages qui dépendent de pkg. */
    public int ca(String pkg) {
        int count = 0;
        for (String other : packages()) {
            if (!other.equals(pkg) && dependsOn(other).contains(pkg)) {
                count++;
            }
        }
        return count;
    }

    /** Ce (couplage efférent) : nombre de packages dont pkg dépend. */
    public int ce(String pkg) {
        return dependsOn(pkg).size();
    }

    /** I = Ce / (Ca + Ce) : 0 = totalement stable, 1 = totalement instable. */
    public double instability(String pkg) {
        int ca = ca(pkg);
        int ce = ce(pkg);
        return ca + ce == 0 ? 0 : (double) ce / (ca + ce);
    }

    /** A = Na / Nc : 0 = totalement concret, 1 = totalement abstrait. */
    public double abstractness(String pkg) {
        return (double) na(pkg) / nc(pkg);
    }

    /** D = |A + I - 1| : distance à la séquence principale (0 = idéal). */
    public double distance(String pkg) {
        return Math.abs(abstractness(pkg) + instability(pkg) - 1);
    }

    public double meanDistance() {
        double sum = 0;
        for (String pkg : packages()) {
            sum += distance(pkg);
        }
        return sum / packages().size();
    }

    /** Position dans le plan (I, A) : sous la séquence principale (A + I < 1) on va vers la zone de douleur. */
    public String position(String pkg) {
        double d = distance(pkg);
        boolean painSide = abstractness(pkg) + instability(pkg) < 1;
        if (d <= 0.1) return "séquence principale";
        if (d >= 0.9) return painSide ? "zone de douleur" : "zone d'inutilité";
        return painSide ? "côté douleur" : "côté inutilité";
    }

    /** SDP : une flèche a → b est contraire au principe si b est moins stable que a. */
    public boolean violatesSdp(String from, String to) {
        return instability(to) > instability(from) + 1e-9;
    }

    /** ADP : cycles élémentaires du graphe, chacun listé une seule fois. */
    public List<List<String>> cycles() {
        List<String> order = packages();
        List<List<String>> found = new ArrayList<>();
        for (int start = 0; start < order.size(); start++) {
            List<String> path = new ArrayList<>();
            path.add(order.get(start));
            explore(order, start, path, found);
        }
        return found;
    }

    // Ne suit que les packages placés après « start » : chaque cycle est trouvé une fois, depuis son premier package.
    private void explore(List<String> order, int start, List<String> path, List<List<String>> found) {
        String current = path.get(path.size() - 1);
        for (String next : dependsOn(current)) {
            int index = order.indexOf(next);
            if (index == start) {
                List<String> cycle = new ArrayList<>(path);
                cycle.add(next);
                found.add(cycle);
            } else if (index > start && !path.contains(next)) {
                path.add(next);
                explore(order, start, path, found);
                path.remove(path.size() - 1);
            }
        }
    }
}
