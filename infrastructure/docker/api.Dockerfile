# ---- build ----
FROM node:22-alpine AS build
WORKDIR /repo
COPY package.json package-lock.json* ./
COPY apps/api/package.json apps/api/
COPY packages ./packages
RUN npm ci --workspace @te/api --include-workspace-root || npm install --workspace @te/api
COPY tsconfig.base.json ./
COPY apps/api ./apps/api
RUN npm run build -w @te/api

# ---- run ----
FROM node:22-alpine
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build /repo/apps/api/dist ./dist
COPY apps/api/package.json ./
RUN npm install --omit=dev --ignore-scripts && npm cache clean --force
USER node
EXPOSE 4000
HEALTHCHECK CMD wget -qO- http://localhost:4000/api/health || exit 1
CMD ["node", "dist/index.js"]
