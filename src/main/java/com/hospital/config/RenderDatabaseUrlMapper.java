package com.hospital.config;

import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.MapPropertySource;
import org.springframework.util.StringUtils;

import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;

/**
 * Maps Render/Neon {@code DATABASE_URL=postgresql://...} to {@code spring.datasource.*}.
 * Called from {@link RenderDatabaseUrlEnvironmentListener} after the full environment is ready,
 * so it always overrides values from application-postgres (e.g. old localhost default).
 */
public final class RenderDatabaseUrlMapper {

    private RenderDatabaseUrlMapper() {
    }

    public static void applyTo(ConfigurableEnvironment environment) {
        // docker-compose / local explicit JDBC (not Render's DATABASE_URL)
        if (StringUtils.hasText(environment.getProperty("SPRING_DATASOURCE_URL"))) {
            return;
        }
        String rawDatabaseUrl = environment.getProperty("DATABASE_URL");
        if (rawDatabaseUrl == null || !StringUtils.hasText(rawDatabaseUrl.trim())) {
            return;
        }
        String databaseUrl = rawDatabaseUrl.trim();
        if (!databaseUrl.startsWith("postgresql://") && !databaseUrl.startsWith("postgres://")) {
            return;
        }
        int schemeLen = databaseUrl.startsWith("postgresql://") ? 15 : 11;
        String rest = databaseUrl.substring(schemeLen);
        int at = rest.indexOf('@');
        if (at < 0) {
            return;
        }
        String userInfo = rest.substring(0, at);
        String afterAt = rest.substring(at + 1);
        String[] up = userInfo.split(":", 2);
        if (up.length < 1 || !StringUtils.hasText(up[0])) {
            return;
        }
        String user = urlDecode(up[0]);
        String pass = up.length > 1 ? urlDecode(up[1]) : "";
        int slash = afterAt.indexOf('/');
        if (slash < 0) {
            return;
        }
        String hostPart = afterAt.substring(0, slash);
        String pathAndQuery = afterAt.substring(slash + 1);
        if (!StringUtils.hasText(pathAndQuery)) {
            return;
        }
        int hostColon = hostPart.lastIndexOf(':');
        String host;
        int port;
        if (hostColon > 0) {
            host = hostPart.substring(0, hostColon);
            try {
                port = Integer.parseInt(hostPart.substring(hostColon + 1));
            } catch (NumberFormatException e) {
                return;
            }
        } else {
            host = hostPart;
            port = 5432;
        }
        if (!StringUtils.hasText(host)) {
            return;
        }
        int qm = pathAndQuery.indexOf('?');
        String dbName = (qm < 0 ? pathAndQuery : pathAndQuery.substring(0, qm));
        if (dbName.startsWith("/")) {
            dbName = dbName.substring(1);
        }
        if (!StringUtils.hasText(dbName)) {
            return;
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
        Map<String, Object> m = new HashMap<>();
        m.put("spring.datasource.url", jdbcUrl);
        m.put("spring.datasource.username", user);
        m.put("spring.datasource.password", pass);
        environment
                .getPropertySources()
                .addFirst(new MapPropertySource("renderOrNeonPostgresFromDatabaseUrl", m));
    }

    private static String urlDecode(String s) {
        if (s == null || s.isEmpty()) {
            return s;
        }
        return URLDecoder.decode(s, StandardCharsets.UTF_8);
    }
}
