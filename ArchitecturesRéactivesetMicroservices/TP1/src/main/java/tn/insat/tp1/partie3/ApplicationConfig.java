package tn.insat.tp1.partie3;

/**
 * Partie 3 : configuration unique pour toute l'application (pattern Singleton).
 */
public class ApplicationConfig {

    // L'unique instance, partagée par tout le programme.
    private static ApplicationConfig instance;

    private String databaseUrl;
    private String applicationName;

    // Étape 1 : constructeur privé, personne ne peut plus faire new ApplicationConfig().
    private ApplicationConfig() {
    }

    // Étape 2 : seul point d'accès à l'instance.
    // synchronized : si deux threads appellent en même temps, un seul crée l'instance.
    public static synchronized ApplicationConfig getInstance() {
        if (instance == null) {
            instance = new ApplicationConfig();
        }
        return instance;
    }

    public String getDatabaseUrl() {
        return databaseUrl;
    }

    public void setDatabaseUrl(String databaseUrl) {
        this.databaseUrl = databaseUrl;
    }

    public String getApplicationName() {
        return applicationName;
    }

    public void setApplicationName(String applicationName) {
        this.applicationName = applicationName;
    }
}
