ecj-rt5.jar is the Eclipse Compiler for Java (ECJ) 3.38.0, from Maven Central
(org.eclipse.jdt:ecj:3.38.0), released under the Eclipse Public License 2.0.

It is used to compile Java inside the browser, running on CheerpJ's Java 17 (see ../java.html).
Two changes were made, in org/eclipse/jdt/internal/compiler/util/JRTUtil.java (full modified
source in this folder, original at https://github.com/eclipse-jdt/eclipse.jdt.core, tag R4_32):

  - Jdk.readJdkReleaseFile: when the JDK has no "release" file, use the running Java version.
  - JRTUtil.getJrtFileSystem: when the running JDK has no lib/jrt-fs.jar, use the default "jrt:/" file system.

The jar was rebuilt with the patched classes and without the Eclipse signature files.
