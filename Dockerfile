# Matches the two-stage node:alpine pattern used across the other
# forhu-project APIs (see e.g. ilovelawyer-api/Dockerfile) - build with full
# devDependencies, ship only the compiled output + prod node_modules.
FROM node:22-alpine AS builder
# libc6-compat: Prisma's query engine binary expects glibc-like symbols even
# on musl-based Alpine. openssl: Prisma's engine links against it directly.
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci

COPY . .

RUN npx prisma generate
RUN npm run build

FROM node:22-alpine AS runner
RUN apk add --no-cache openssl
WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

EXPOSE 4000
ENV PORT=4000

CMD ["npm", "start"]
