package com.hospital;

import com.hospital.config.RenderDatabaseUrlMapper;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class HospitalManagementApplication {
    public static void main(String[] args) {
        // Render/Neon: DATABASE_URL is only available in the OS environment; set JDBC props before
        // Spring so DataSource auto-configuration can resolve spring.datasource.url.
        RenderDatabaseUrlMapper.applyFromEnvToSystemProperties();
        SpringApplication.run(HospitalManagementApplication.class, args);
    }
}
