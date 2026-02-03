# Create a build of the project
FROM node:22 AS build
WORKDIR /build
COPY . .

RUN yarn install --network-timeout 1000000
RUN yarn run build

# Copy the build artifacts
FROM node:22
WORKDIR /app
COPY --from=build /build .

# Run the app
ENTRYPOINT exec yarn start