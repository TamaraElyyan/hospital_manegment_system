package com.hospital.config;

import org.springframework.util.StringUtils;

import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
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
        if (StringUtils.hasText(safeEnv("SPRING_DATASOURCE_URL"))) {
            return;
        }
        String databaseUrl = safeEnv("DATABASE_URL");
        if (!StringUtils.hasText(databaseUrl)) {
            return;
        }
        Optional<DatasourceProps> p = parsePostgresUrl(databaseUrl.trim());
        if (p.isEmpty()) {
            return;
        }
        DatasourceProps d = p.get();
        System.setProperty("spring.datasource.url", d.url());
        System.setProperty("spring.datasource.username", d.username());
        System.setProperty("spring.datasource.password", d.password());
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
        return URLDecoder.decode(s, StandardCharsets.UTF_8);
    }
}
