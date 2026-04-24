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
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
