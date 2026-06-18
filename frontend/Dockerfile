# Etapa de construcción del frontend
FROM node:24-alpine AS construccion

WORKDIR /app

ARG VITE_API_URL
ARG VITE_NOMBRE_SISTEMA

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run construir

# Etapa de producción con Nginx
FROM nginx:alpine AS produccion

COPY --from=construccion /app/dist /usr/share/nginx/html
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
