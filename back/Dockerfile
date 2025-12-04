# ===========================
# Etapa 1: Build con Maven
# ===========================
FROM maven:3.9.9-eclipse-temurin-21 AS build

WORKDIR /app

# Copiamos solo lo necesario para aprovechar cache
COPY pom.xml .
COPY src ./src

# Construimos el jar (sin tests)
RUN mvn clean package -DskipTests

# ===========================
# Etapa 2: Runtime (solo JRE)
# ===========================
FROM eclipse-temurin:21-jre

WORKDIR /app

# Copiamos el jar construido en la etapa anterior
COPY --from=build /app/target/*.jar app.jar

# Valores por defecto (se pueden sobreescribir con docker-compose)
ENV DB_HOST=localhost \
    DB_PORT=3306 \
    DB_NAME=meli-check \
    DB_USER=root \
    DB_PASS=root \
    SERVER_PORT=8081 \
    JWT_SECRET=change_me \
    JWT_EXPIRATION=604800

# Spring usa SERVER_PORT para server.port
EXPOSE 8081

ENTRYPOINT ["java", "-jar", "app.jar"]
