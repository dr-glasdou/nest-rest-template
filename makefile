# NestJS GraphQL API Makefile
# Simplified commands for running the project

.PHONY: help dev debug prod docker-build docker-build-image docker-run docker-run-prod docker-stop docker-clean docker-logs docker-logs-prod db-migrate db-seed db-setup

# Default target
help: ## Show this help message
	@echo "Available commands:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  %-20s %s\n", $$1, $$2}'

# Development Commands
dev: ## Start the application in development mode with watch
	pnpm run start:dev

debug: ## Start the application in debug mode
	pnpm run start:debug

prod: ## Start the application in production mode
	pnpm run start:prod

# Docker Commands
docker-build: ## Build docker images via compose.build.yml (versioned + latest tags)
	@echo "Building Docker images..."
	@APP_VERSION=$$(node -p "require('./package.json').version.replace(/[^A-Za-z0-9_.-]/g,'-')") docker compose -f compose.build.yml build

docker-build-image: ## Build production image directly from dockerfile.prod as drglasdou/rest_api:latest
	docker build -f dockerfile.prod -t drglasdou/rest_api:latest .

docker-run-infra: ## Start infra only (postgres, redis) — for local dev
	docker compose -f compose.yml up -d

docker-run: ## Start all services (app + postgres + redis) using compose.prod.yml
	docker compose -f compose.yml -f compose.prod.yml up -d

docker-run-prod: ## Start all services (app + postgres + redis) using compose.prod.yml
	docker compose -f compose.yml -f compose.prod.yml up -d

docker-stop: ## Stop all containers (preserves volumes/data)
	docker compose -f compose.yml -f compose.prod.yml down

docker-clean: ## Destroy containers + volumes + local images (caution: data loss)
	docker compose -f compose.yml -f compose.prod.yml down -v --rmi local --remove-orphans

docker-logs: ## Follow logs for infra containers
	docker compose -f compose.yml logs -f

docker-logs-prod: ## Follow logs for all services (app + infra)
	docker compose -f compose.yml -f compose.prod.yml logs -f

db-migrate: ## Run database migrations
	pnpm prisma migrate dev

db-seed: ## Seed the database
	pnpm prisma db seed

db-setup: ## Set up the database (migrate and seed)
	pnpm prisma migrate dev
	pnpm prisma db seed
