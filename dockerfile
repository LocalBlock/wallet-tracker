# Build stage
FROM node:alpine AS build

WORKDIR /app

# Installing dependencies
COPY ./package.json ./
RUN yarn

# Copying all the files in our project
COPY . .

# Building our application
RUN yarn build

# Fetching the latest nginx image
FROM nginx

# Copying built assets from build
COPY --from=build /app/dist /usr/share/nginx/html

# Copying our nginx.conf
COPY /docker/nginx.conf /etc/nginx/conf.d/default.conf