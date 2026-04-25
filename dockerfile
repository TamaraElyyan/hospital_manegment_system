# Build:  docker build -t hospital-api .
# Run:    use docker-compose (Postgres) or: docker run -p 8080:8080 -e SPRING_PROFILES_ACTIVE=sqlite hospital-api
FROM maven:3.9.9-eclipse-temurin-17 AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN mvn -q -DskipTests package

FROM eclipse-temurin:17-jre-jammy
WORKDIR /app
COPY --from=build /app/target/hospital-management-1.0.0.jar /app/app.jar
EXPOSE 8080
ENV SPRING_PROFILES_ACTIVE=postgres
# Render free tier ~512MB RAM: cap heap so the JVM is not OOM-killed before Tomcat binds PORT
ENV JAVA_TOOL_OPTIONS="-XX:+UseContainerSupport -XX:MaxRAMPercentage=65.0 -XX:InitialRAMPercentage=20.0"
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
