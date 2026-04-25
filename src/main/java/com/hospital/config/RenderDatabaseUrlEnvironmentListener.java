package com.hospital.config;

import org.springframework.boot.context.event.ApplicationEnvironmentPreparedEvent;
import org.springframework.context.ApplicationListener;
import org.springframework.core.Ordered;
import org.springframework.lang.NonNull;

/**
 * Runs after the environment is prepared; adds {@code DATABASE_URL}-derived JDBC properties with
 * highest precedence so stale {@code SPRING_DATASOURCE_PASSWORD} (or similar) from the host
 * environment cannot override the linked database credentials.
 */
public class RenderDatabaseUrlEnvironmentListener
        implements ApplicationListener<ApplicationEnvironmentPreparedEvent>, Ordered {

    @Override
    public void onApplicationEvent(@NonNull ApplicationEnvironmentPreparedEvent event) {
        RenderDatabaseUrlMapper.addAsHighestPriorityPropertySource(event.getEnvironment());
    }

    @Override
    public int getOrder() {
        return Ordered.LOWEST_PRECEDENCE;
    }
}
