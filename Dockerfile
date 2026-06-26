FROM node:20-slim AS base
WORKDIR /app

FROM base AS prod-deps
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

FROM base AS build
COPY package.json package-lock.json ./
RUN npm ci
COPY prisma ./prisma
COPY . .
RUN npm run build

FROM base
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public

RUN mkdir -p data

ENV HOST=0.0.0.0
ENV PORT=3000
EXPOSE 3000
CMD [ "sh", "-c", "npx prisma db push && node server.js" ]