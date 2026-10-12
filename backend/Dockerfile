# Java 26 matches pom.xml; tests run without a real Groq key.
FROM maven:3.9-eclipse-temurin-26 AS build
WORKDIR /workspace
COPY pom.xml ./
COPY src ./src
RUN mvn -B -ntp verify

FROM eclipse-temurin:26-jre-jammy AS runtime
WORKDIR /app
RUN groupadd --system app && useradd --system --gid app --home-dir /app app
COPY --from=build --chown=app:app /workspace/target/resume-reviewer-0.0.1-SNAPSHOT.jar /app/app.jar
USER app
ENV SPRING_PROFILES_ACTIVE=prod
# Render's PORT environment variable determines the actual listening port.
EXPOSE 8080
ENTRYPOINT ["java", "-XX:MaxRAMPercentage=65.0", "-Djava.awt.headless=true", "-jar", "/app/app.jar"]
