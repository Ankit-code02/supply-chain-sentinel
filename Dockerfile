
# Build the Spring Boot application
FROM maven:3.9-eclipse-temurin-21 AS build

WORKDIR /app

COPY backend/pom.xml ./pom.xml
COPY backend/src ./src

RUN mvn -B -DskipTests package

# Run the application
FROM eclipse-temurin:21-jre

WORKDIR /app

COPY --from=build /app/target/*.jar app.jar

EXPOSE 10000

ENTRYPOINT ["sh", "-c", "java -Duser.timezone=UTC -jar app.jar --server.port=${PORT:-10000}"]
