# Create a build of the project
FROM eclipse-temurin:25 AS build
WORKDIR /build
COPY . .

RUN ./gradlew build --no-daemon -p .

# Copy the build artifacts
FROM eclipse-temurin:25-jre
WORKDIR /app

ENV SPRING_PROFILES_ACTIVE=docker,prod


COPY --from=build /build/libs/farmers-market-1.0.0-SNAPSHOT.jar app.jar

# Run the app
ENTRYPOINT exec java $JAVA_OPTS -jar app.jar