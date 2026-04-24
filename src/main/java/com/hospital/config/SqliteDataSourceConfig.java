package com.hospital.config;

import com.zaxxer.hikari.HikariDataSource;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.context.annotation.Profile;

import javax.sql.DataSource;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

/**
 * Binds SQLite explicitly so a leftover system env var {@code SPRING_DATASOURCE_URL} pointing at
 * PostgreSQL cannot override the profile and produce "SQLite driver + postgres URL" failures.
 */
@Configuration
@Profile("sqlite")
public class SqliteDataSourceConfig {

    @Bean
    @Primary
    public DataSource sqliteDataSource() throws Exception {
        Path dataDir = Paths.get("data");
        Files.createDirectories(dataDir);
        Path db = dataDir.resolve("hospital.sqlite3").toAbsolutePath();
        HikariDataSource ds = new HikariDataSource();
        ds.setPoolName("HospitalSqlite");
        ds.setDriverClassName("org.sqlite.JDBC");
        ds.setJdbcUrl("jdbc:sqlite:" + db + ";DB_CLOSE_DELAY=-1");
        return ds;
    }
}
