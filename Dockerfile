FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./

RUN npm ci --only=production --legacy-peer-deps

FROM node:20-alpine AS production

WORKDIR /app

RUN addgroup -S appgroup && adduser -S appuser -G appgroup

COPY --from=builder /app/node_modules ./node_modules

COPY . .

RUN chown -R appuser:appgroup /app

USER appuser

EXPOSE 8080

ENV NODE_ENV=production
CMD ["node", "app.js"]