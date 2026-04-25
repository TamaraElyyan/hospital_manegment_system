package com.hospital;

import com.hospital.config.RenderDatabaseUrlMapper;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.event.ApplicationFailedEvent;
import org.springframework.context.ApplicationListener;
import org.springframework.util.StringUtils;

@SpringBootApplication
public class HospitalManagementApplication {
    public static void main(String[] args) {
        // Render/Neon: DATABASE_URL is only available in the OS environment; set JDBC props before
        // Spring so DataSource auto-configuration can resolve spring.datasource.url.
        RenderDatabaseUrlMapper.applyFromEnvToSystemProperties();
        failIfPostgresProfileWithNoJdbcUrl();
        SpringApplication app = new SpringApplication(HospitalManagementApplication.class);
        app.addListeners((ApplicationListener<ApplicationFailedEvent>) e -> {
            System.err.println("========== Application failed to start (root cause at bottom) ==========");
            e.getException().printStackTrace(System.err);
        });
        app.run(args);
    }

    private static void failIfPostgresProfileWithNoJdbcUrl() {
        String profiles = safeEnv("SPRING_PROFILES_ACTIVE");
        if (!StringUtils.hasText(profiles) || !profiles.contains("postgres")) {
            return;
        }
        boolean fromEnv = StringUtils.hasText(safeEnv("SPRING_DATASOURCE_URL").trim());
        boolean fromProp = StringUtils.hasText(System.getProperty("spring.datasource.url"));
        boolean haveDbUrl = StringUtils.hasText(safeEnv("DATABASE_URL"));
        if (fromEnv || fromProp) {
            return;
        }
        if (haveDbUrl) {
            System.err.println(
                    "FATAL: SPRING_PROFILES_ACTIVE includes \"postgres\" but DATABASE_URL was not"
                            + " mapped to JDBC (parsing failed). See stderr above from"
                            + " RenderDatabaseUrlMapper, or set SPRING_DATASOURCE_URL.");
            System.exit(1);
        }
        System.err.println(
                "FATAL: \"postgres\" profile is active but no database URL. Set"
                        + " SPRING_DATASOURCE_URL, or link DATABASE_URL from your Render database.");
        System.exit(1);
    }

    private static String safeEnv(String key) {
        String v = System.getenv(key);
        return v == null ? "" : v;
    }
}
