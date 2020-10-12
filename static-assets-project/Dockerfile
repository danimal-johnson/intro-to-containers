FROM node:latest
WORKDIR /app
COPY . .
RUN npm ci && npm run build

# You could use nginx:latest here instead.
FROM nginx:alpine
COPY --from=0 /app/build /usr/share/nginx/html
