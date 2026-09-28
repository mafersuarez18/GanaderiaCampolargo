# Etapa de construcción
FROM node:24-alpine AS construccion

WORKDIR /app

RUN apk add --no-cache openssl

COPY package*.json ./
# --ignore-scripts: el postinstall (`prisma generate`) necesita prisma/schema.prisma,
# que todavía no existe en esta capa (se copia recién abajo con `COPY . .`).
RUN npm ci --ignore-scripts

COPY . .
RUN npx prisma generate
RUN npm run construir

# Etapa de producción (imagen final liviana)
FROM node:24-alpine AS produccion

WORKDIR /app

RUN apk add --no-cache openssl

COPY package*.json ./
# El cliente de Prisma ya generado se copia más abajo desde la etapa de
# construcción, así que aquí tampoco hace falta (ni es posible) correr el
# postinstall.
RUN npm ci --only=production --ignore-scripts

COPY --from=construccion /app/dist ./dist
COPY --from=construccion /app/node_modules/.prisma ./node_modules/.prisma
COPY prisma ./prisma

RUN addgroup -g 1001 -S nodejs && \
    adduser -S campolargo -u 1001
USER campolargo

EXPOSE 3001

CMD ["node", "dist/servidor.js"]
