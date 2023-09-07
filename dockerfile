# Build stage
# Build app with vite
FROM node:18-alpine AS build

WORKDIR /app

# Installing dependencies
COPY ./package.json ./
RUN yarn

# Copying all the files in our project
COPY . .

# Building our application
RUN yarn build

# Build server
FROM node:18-alpine
WORKDIR /srv

# Install server app dependencies (production)
COPY ./server/package*.json ./
RUN npm ci --omit=dev

COPY ./server/*.js ./

# Copy app from build stage to server
COPY --from=build /app/dist ./app

# Set Node.js to production
ENV NODE_ENV=production

CMD [ "node","server.js" ]

# Server port
EXPOSE 3000