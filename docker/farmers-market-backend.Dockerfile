# Create a build of the project
FROM gradle:9.1.0-jdk25 AS build
WORKDIR /build
COPY . .

RUN ./gradlew build --no-daemon -p .

# Copy the build artifacts
FROM openjdk:25
WORKDIR /app

ENV SPRING_PROFILES_ACTIVE=docker,prod


COPY --from=build /build/build/libs/farmers-market-1.0.0-SNAPSHOT.jar app.jar

# Run the app
ENTRYPOINT exec java $JAVA_OPTS -jar app.jar