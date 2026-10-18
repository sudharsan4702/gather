# Multi-stage Docker build for Catane Gather Backend

# Stage 1: Build the JAR with Maven & Eclipse Temurin JDK 17
FROM maven:3.9.6-eclipse-temurin-17-alpine AS build
WORKDIR /app

# Copy pom.xml and fetch dependencies (Docker layer cached)
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copy source code and package application
COPY src ./src
RUN mvn clean package -DskipTests

# Stage 2: Minimal, secure JRE 17 runtime
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

# Create non-root application user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Create uploads directory with appropriate permissions
RUN mkdir -p /app/uploads && chown -R appuser:appgroup /app

# Copy built JAR artifact from build stage
COPY --from=build --chown=appuser:appgroup /app/target/gather-0.0.1-SNAPSHOT.jar app.jar

USER appuser

# Default port
EXPOSE 8080

# Optimized memory flags for Render 512MB free tier
ENV JAVA_OPTS="-Xmx350m -Xss256k -XX:+UseSerialGC"

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
