package com.hospital.config;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.env.EnvironmentPostProcessor;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.MapPropertySource;
import org.springframework.util.StringUtils;

import java.net.URI;
import java.util.HashMap;
import java.util.Map;

/**
 * Converts Render/Neon style {@code DATABASE_URL=postgresql://user:pass@host:port/db?sslmode=require}
 * into Spring's {@code spring.datasource.*} (JDBC) when the JDBC URL is not set explicitly.
 */
@Order(Ordered.HIGHEST_PRECEDENCE)
public class RenderPostgresEnvPostProcessor implements EnvironmentPostProcessor {

    @Override
    public void postProcessEnvironment(ConfigurableEnvironment environment, SpringApplication app) {
        if (StringUtils.hasText(environment.getProperty("spring.datasource.url"))) {
            return;
        }
        String databaseUrl = environment.getProperty("DATABASE_URL");
        if (!StringUtils.hasText(databaseUrl)) {
            return;
        }
        databaseUrl = databaseUrl.trim();
        if (!databaseUrl.startsWith("postgresql://") && !databaseUrl.startsWith("postgres://")) {
            return;
        }
        int schemeLen = databaseUrl.startsWith("postgresql://") ? 15 : 11;
        try {
            String u = "http://" + databaseUrl.substring(schemeLen);
            URI httpUri = new URI(u);
            String userInfo = httpUri.getUserInfo();
            if (userInfo == null) {
                return;
            }
            int c = userInfo.indexOf(':');
            if (c < 1) {
                return;
            }
            String user = userInfo.substring(0, c);
            String pass = userInfo.length() > c + 1 ? userInfo.substring(c + 1) : "";
            String host = httpUri.getHost();
            if (!StringUtils.hasText(host)) {
                return;
            }
            int port = httpUri.getPort() > 0 ? httpUri.getPort() : 5432;
            String path = httpUri.getPath();
            if (path != null && path.startsWith("/")) {
                path = path.substring(1);
            }
            if (!StringUtils.hasText(path)) {
                return;
            }
            String q = httpUri.getQuery();
            String jdbcUrl;
            if (!StringUtils.hasText(q)) {
                jdbcUrl = "jdbc:postgresql://" + host + ":" + port + "/" + path + "?sslmode=require";
            } else {
                if (q.contains("sslmode=")) {
                    jdbcUrl = "jdbc:postgresql://" + host + ":" + port + "/" + path + "?" + q;
                } else {
                    jdbcUrl = "jdbc:postgresql://" + host + ":" + port + "/" + path + "?" + q + "&sslmode=require";
                }
            }
            Map<String, Object> m = new HashMap<>();
            m.put("spring.datasource.url", jdbcUrl);
            m.put("spring.datasource.username", user);
            m.put("spring.datasource.password", pass);
            environment.getPropertySources().addFirst(
                    new MapPropertySource("renderOrNeonPostgresFromDatabaseUrl", m));
        } catch (Exception e) {
            System.err.println("RenderPostgresEnvPostProcessor: " + e.getMessage());
        }
    }
}
