FROM node:22-alpine AS base

# Step 1. Rebuild the source code only when needed
FROM base AS builder

WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* ./
# Omit --production flag for TypeScript devDependencies
RUN \
  if [ -f yarn.lock ]; then yarn --frozen-lockfile; \
  elif [ -f package-lock.json ]; then npm ci; \
  elif [ -f pnpm-lock.yaml ]; then yarn global add pnpm && pnpm i; \
  # Allow install without lockfile, so example works even without Node.js installed locally
  else echo "Warning: Lockfile not found. It is recommended to commit lockfiles to version control." && yarn install; \
  fi

# COPY src ./src
# COPY public ./public
# COPY next.config.js .
# COPY tsconfig.json .
COPY . .

# Copy Prisma schema and migration files
COPY prisma ./prisma/

# Generate prisma client
RUN yarn prisma generate

# Environment variables must be present at build time
# https://github.com/vercel/next.js/discussions/14030
# ARG DATABASE_URL
# ENV DATABASE_URL=${DATABASE_URL}
# ARG ALCHEMY_APIKEY
# ENV ALCHEMY_APIKEY=${ALCHEMY_APIKEY}
# ARG ALCHEMY_AUTHTOKEN
# ENV ALCHEMY_AUTHTOKEN=${ALCHEMY_AUTHTOKEN}
# ARG NEXT_PUBLIC_ENV_VARIABLE
# ENV NEXT_PUBLIC_ENV_VARIABLE=${NEXT_PUBLIC_ENV_VARIABLE}

# Next.js collects completely anonymous telemetry data about general usage. Learn more here: https://nextjs.org/telemetry
# Uncomment the following line to disable telemetry at build time
# ENV NEXT_TELEMETRY_DISABLED 1

# Build Next.js based on the preferred package manager
RUN \
  if [ -f yarn.lock ]; then yarn build; \
  elif [ -f package-lock.json ]; then npm run build; \
  elif [ -f pnpm-lock.yaml ]; then pnpm build; \
  else yarn build; \
  fi

# Note: It is not necessary to add an intermediate step that does a full copy of `node_modules` here

# Step 2. Production image, copy all the files and run next
FROM base AS runner

WORKDIR /app

# Don't run production as root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
USER nextjs

COPY --from=builder /app/public ./public

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Prisma
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma

# Environment variables must be redefined at run time
# ARG DATABASE_URL
# ENV DATABASE_URL=${DATABASE_URL}
# ARG ALCHEMY_APIKEY
# ENV ALCHEMY_APIKEY=${ALCHEMY_APIKEY}
# ARG ALCHEMY_AUTHTOKEN
# ENV ALCHEMY_AUTHTOKEN=${ALCHEMY_AUTHTOKEN}

# Uncomment the following line to disable telemetry at run time
# ENV NEXT_TELEMETRY_DISABLED 1

# Note: Don't expose ports here, Compose will handle that for us

# CMD ["node", "server.js"]

# Add prisma cli to execute prisma migrate deploy
RUN yarn global add prisma

# Fix Error: connect ECONNREFUSED 127.0.0.1:3000 with fetch in server action
ENV HOSTNAME=0.0.0.0

# Excecute command from package JSON to initialise or migrate Database (prisma migrate deploy) and start server 
CMD [ "yarn","run", "prod" ]