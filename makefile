.PHONY: help install dev debug prod lint lint-check format format-check lint-fix docker-build docker-build-image docker-run docker-run-prod docker-stop docker-clean docker-logs docker-logs-prod db-migrate db-seed db-setup setup

.DEFAULT_GOAL := help

PNPM := pnpm
PNPX := pnpx

##@ General
help: ## Show this help
	@awk 'BEGIN {FS = ":.*##"; printf "\nUsage:\n  make \033[36m<target>\033[0m\n"} /^[a-zA-Z_-]+:.*?##/ { printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2 } /^##@/ { printf "\n\033[1m%s\033[0m\n", substr($$0, 5) } ' $(MAKEFILE_LIST)

##@ Setup
setup: ## Clean install (remove node_modules + lock file + reinstall)
	@echo "⚠️  This will delete node_modules and pnpm-lock.yaml and reinstall all dependencies"
	@sleep 3
	rm -rf node_modules pnpm-lock.yaml
	$(PNPM) install
	$(PNPM) prisma generate

install: ## Install dependencies
	$(PNPM) install

##@ Development
dev: ## Start the application in development mode with watch
	$(PNPM) run start:dev

portless: ## Start the application in development mode with watch via portless
	$(PNPM) run start:portless

debug: ## Start the application in debug mode
	$(PNPM) run start:debug

prod: ## Start the application in production mode
	$(PNPM) run start:prod

##@ Lint & Format
lint: ## Lint and auto-fix code (biome check --write)
	$(PNPM) run lint

lint-check: ## Check lint without writing
	$(PNPM) run lint:check

format: ## Format code (biome format --write)
	$(PNPM) run format

format-check: ## Check format without writing
	$(PNPM) run format:check

lint-fix: ## Lint + format in one pass
	$(PNPM) run lint:fix

##@ Docker
docker-build: ## Build docker images via compose.build.yml (versioned + latest tags)
	@echo "Building Docker images..."
	@APP_VERSION=$$(node -p "require('./package.json').version.replace(/[^A-Za-z0-9_.-]/g,'-')") docker compose -f compose.build.yml build

docker-build-image: ## Build production image directly from dockerfile.prod as drglasdou/rest_api:latest
	docker build -f dockerfile.prod -t drglasdou/rest_api:latest .

docker-run: ## Start all services (app + postgres + redis) using compose.prod.yml
	docker compose -f compose.yml up -d

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

##@ Database
db-migrate: ## Run database migrations
	$(PNPM) prisma migrate dev

db-seed: ## Seed the database
	$(PNPM) prisma db seed

db-setup: ## Set up the database (migrate and seed)
	$(PNPM) prisma migrate dev
	$(PNPM) prisma db seed
