FROM node:22-alpine AS deps
WORKDIR /app
# Install build dependencies for native modules (pdf-parse, canvas, etc.)
RUN apk add --no-cache python3 make g++ cairo-dev jpeg-dev pango-dev giflib-dev
COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci

FROM node:22-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

FROM node:22-alpine AS run
WORKDIR /app
# Install runtime dependencies for native modules
RUN apk add --no-cache cairo jpeg pango giflib
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=8080 HOSTNAME=0.0.0.0 \
    GOVDOC_DEV_USER=admin GOVDOC_DEV_PASS=admin
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public
COPY --from=build /app/artifacts ./artifacts
COPY --from=build /app/features/usecases/row-appraisal/assets ./features/usecases/row-appraisal/assets
COPY .env.local ./.env.local
COPY start.sh ./start.sh
RUN chmod +x start.sh
EXPOSE 8080
CMD ["./start.sh"]
