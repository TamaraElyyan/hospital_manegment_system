package com.hospital.config;

import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.MapPropertySource;
import org.springframework.util.StringUtils;

import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

/**
 * Maps Render's {@code DATABASE_URL=postgresql://...} into
 * {@code spring.datasource.*} as JVM system properties before Spring Boot starts, so
 * auto-configuration always sees a JDBC URL (avoids empty url when listeners do not run).
 * <p>
 * If {@code SPRING_DATASOURCE_URL} is set (e.g. docker-compose), that takes precedence and this is a
 * no-op.
 */
public final class RenderDatabaseUrlMapper {

    private record DatasourceProps(String url, String username, String password) {
    }

    private RenderDatabaseUrlMapper() {
    }

    /**
     * Call from {@code public static void main} before {@link org.springframework.boot.SpringApplication#run}.
     */
    public static void applyFromEnvToSystemProperties() {
        // Blank or whitespace-only should not block Render's DATABASE_URL (some dashboards set empty key)
        String springEnv = safeEnv("SPRING_DATASOURCE_URL").trim();
        if (StringUtils.hasText(springEnv)) {
            return;
        }
        String databaseUrl = safeEnv("DATABASE_URL");
        if (!StringUtils.hasText(databaseUrl)) {
            return;
        }
        String trimmed = databaseUrl.trim();
        Optional<DatasourceProps> p = parsePostgresUrl(trimmed);
        if (p.isEmpty()) {
            System.err.println(
                    "RenderDatabaseUrlMapper: DATABASE_URL is set but is not a supported postgresql:// URL (len="
                            + trimmed.length()
                            + ", prefix="
                            + (trimmed.length() > 20 ? trimmed.substring(0, 20) : trimmed)
                            + "). Check Render database link and connectionString.");
            return;
        }
        DatasourceProps d = p.get();
        String jdbc = d.url();
        System.setProperty("spring.datasource.url", jdbc);
        System.setProperty("spring.datasource.username", d.username());
        System.setProperty("spring.datasource.password", d.password());
        // Hibernate JPA can read these before/without DataSource metadata (Render, SSL, slow DB)
        System.setProperty("hibernate.connection.url", jdbc);
        System.setProperty("jakarta.persistence.jdbc.url", jdbc);
        System.setProperty("javax.persistence.jdbc.url", jdbc);
    }

    /**
     * Puts {@code spring.datasource.*} (and JPA URL mirrors) at the <strong>front</strong> of the
     * property source chain. That wins over {@code SPRING_DATASOURCE_PASSWORD} / similar env vars
     * still set in the Render dashboard (a common cause of "password authentication failed" even
     * when {@code DATABASE_URL} is correct).
     */
    public static void addAsHighestPriorityPropertySource(ConfigurableEnvironment environment) {
        if (StringUtils.hasText(safeEnv("SPRING_DATASOURCE_URL").trim())) {
            return;
        }
        String databaseUrl = environment.getProperty("DATABASE_URL");
        if (databaseUrl == null) {
            databaseUrl = safeEnv("DATABASE_URL");
        }
        if (!StringUtils.hasText(databaseUrl)) {
            return;
        }
        String trimmed = databaseUrl.trim();
        Optional<DatasourceProps> p = parsePostgresUrl(trimmed);
        if (p.isEmpty()) {
            return;
        }
        DatasourceProps d = p.get();
        String jdbc = d.url();
        Map<String, Object> m = new HashMap<>();
        m.put("spring.datasource.url", jdbc);
        m.put("spring.datasource.username", d.username());
        m.put("spring.datasource.password", d.password());
        m.put("hibernate.connection.url", jdbc);
        m.put("jakarta.persistence.jdbc.url", jdbc);
        m.put("javax.persistence.jdbc.url", jdbc);
        environment
                .getPropertySources()
                .addFirst(new MapPropertySource("renderDatabaseFromUrl", m));
    }

    private static String safeEnv(String key) {
        String v = System.getenv(key);
        return v == null ? "" : v;
    }

    static Optional<DatasourceProps> parsePostgresUrl(String databaseUrl) {
        if (!databaseUrl.startsWith("postgresql://") && !databaseUrl.startsWith("postgres://")) {
            return Optional.empty();
        }
        int schemeLen = databaseUrl.startsWith("postgresql://") ? 15 : 11;
        String rest = databaseUrl.substring(schemeLen);
        int at = rest.indexOf('@');
        if (at < 0) {
            return Optional.empty();
        }
        String userInfo = rest.substring(0, at);
        String afterAt = rest.substring(at + 1);
        String[] up = userInfo.split(":", 2);
        if (up.length < 1 || !StringUtils.hasText(up[0])) {
            return Optional.empty();
        }
        String user = urlDecode(up[0]);
        String pass = up.length > 1 ? urlDecode(up[1]) : "";
        int slash = afterAt.indexOf('/');
        if (slash < 0) {
            return Optional.empty();
        }
        String hostPart = afterAt.substring(0, slash);
        String pathAndQuery = afterAt.substring(slash + 1);
        if (!StringUtils.hasText(pathAndQuery)) {
            return Optional.empty();
        }
        int hostColon = hostPart.lastIndexOf(':');
        String host;
        int port;
        if (hostColon > 0) {
            host = hostPart.substring(0, hostColon);
            try {
                port = Integer.parseInt(hostPart.substring(hostColon + 1));
            } catch (NumberFormatException e) {
                return Optional.empty();
            }
        } else {
            host = hostPart;
            port = 5432;
        }
        if (!StringUtils.hasText(host)) {
            return Optional.empty();
        }
        int qm = pathAndQuery.indexOf('?');
        String dbName = (qm < 0 ? pathAndQuery : pathAndQuery.substring(0, qm));
        if (dbName.startsWith("/")) {
            dbName = dbName.substring(1);
        }
        if (!StringUtils.hasText(dbName)) {
            return Optional.empty();
        }
        String q = qm < 0 ? "" : pathAndQuery.substring(qm + 1);
        String jdbcUrl;
        if (!StringUtils.hasText(q)) {
            jdbcUrl = "jdbc:postgresql://" + host + ":" + port + "/" + dbName + "?sslmode=require";
        } else {
            if (q.contains("sslmode=")) {
                jdbcUrl = "jdbc:postgresql://" + host + ":" + port + "/" + dbName + "?" + q;
            } else {
                jdbcUrl = "jdbc:postgresql://" + host + ":" + port + "/" + dbName + "?" + q + "&sslmode=require";
            }
        }
        return Optional.of(new DatasourceProps(jdbcUrl, user, pass));
    }

    private static String urlDecode(String s) {
        if (s == null || s.isEmpty()) {
            return s;
        }
        try {
            return URLDecoder.decode(s, StandardCharsets.UTF_8);
        } catch (IllegalArgumentException e) {
            // Malformed % sequences in the URL — use raw fragment so JDBC can still work
            return s;
        }
    }
}
