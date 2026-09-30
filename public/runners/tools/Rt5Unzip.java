import java.io.FileInputStream;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;

/**
 * Extracts a zip (first argument) into a folder (second argument). Used by ../java.html to give
 * the Java sources of a work, with their folders, to the compiler running in the browser.
 * Built with: javac --release 17 -d classes Rt5Unzip.java && jar cf ../rt5-unzip.jar -C classes .
 */
public class Rt5Unzip {
    public static void main(String[] args) throws IOException {
        Path target = Paths.get(args[1]).toAbsolutePath().normalize();
        try (ZipInputStream zip = new ZipInputStream(new FileInputStream(args[0]))) {
            for (ZipEntry entry; (entry = zip.getNextEntry()) != null; ) {
                Path file = target.resolve(entry.getName()).normalize();
                if (!file.startsWith(target)) continue; // ignore paths leaving the folder
                if (entry.isDirectory()) {
                    Files.createDirectories(file);
                } else {
                    Files.createDirectories(file.getParent());
                    Files.copy(zip, file, StandardCopyOption.REPLACE_EXISTING);
                }
            }
        }
    }
}
