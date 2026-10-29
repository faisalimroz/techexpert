FROM node:22-alpine AS build
WORKDIR /repo
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_SITE_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL NEXT_TELEMETRY_DISABLED=1
COPY package.json package-lock.json* ./
COPY apps/web/package.json apps/web/
COPY packages ./packages
RUN npm ci --workspace @te/web --include-workspace-root || npm install --workspace @te/web
COPY tsconfig.base.json ./
COPY apps/web ./apps/web
RUN npm run build -w @te/web

FROM node:22-alpine
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1
WORKDIR /app
COPY --from=build /repo/apps/web/.next/standalone ./
COPY --from=build /repo/apps/web/.next/static ./apps/web/.next/static
COPY --from=build /repo/apps/web/public ./apps/web/public
USER node
EXPOSE 3000
CMD ["node", "apps/web/server.js"]
