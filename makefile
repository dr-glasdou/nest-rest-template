# NestJS GraphQL API Makefile

.PHONY: help init setup install dev debug prod \
	docker-build docker-build-image docker-run docker-run-prod \
	docker-stop docker-clean docker-logs docker-logs-prod \
	db-migrate db-seed db-setup check lint format typecheck sync ci clean

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

init: ## Initialize project (install, copy env, start docker, run migrations, seed)
	@echo "\n📋 Initializing project..."
	@echo "\n📄 Copying .env.example to .env..."
	cp -n .env.example .env 2>/dev/null || true
	@echo "\n📦 Installing dependencies..."
	$(MAKE) install
	@echo "\n🐳 Starting Docker services..."
	$(MAKE) docker-run
	@echo "\n🗄️  Running database setup..."
	$(MAKE) db-setup
	@echo "\n✅ Project initialized!"

lefthook: ## Install git hooks
	$(PNPX) lefthook install

##@ Development
dev: ## Start application in development mode with watch
	$(PNPM) run start:dev

portless: ## Start application in development using portless mode
	$(PNPM) run start:portless

debug: ## Start application in debug mode
	$(PNPM) run start:debug

##@ Build
build: ## Build for production
	$(PNPM) build

prod: ## Start application in production mode
	$(PNPM) run start:prod

preview: ## Preview production build
	$(PNPM) run start:prod

##@ Docker
docker-build: ## Build docker images via compose.build.yml (versioned + latest tags)
	@echo "Building Docker images..."
	@APP_VERSION=$$(node -p "require('./package.json').version.replace(/[^A-Za-z0-9_.-]/g,'-')") docker compose -f compose.build.yml build

docker-build-image: ## Build production image as drglasdou/nest-gql.glasdou:latest
	docker build -f dockerfile.prod -t drglasdou/nest-gql.glasdou:latest .

docker-run: ## Start all services (postgres + redis)
	docker compose -f compose.yml up -d

docker-run-prod: ## Start all services using compose.prod.yml
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

db-setup: ## Set up database (migrate and seed)
	$(PNPM) prisma migrate dev && $(PNPM) prisma db seed

##@ Code Quality
code-check: ## Run all code quality checks
	$(PNPM) run format:check
	$(PNPM) run lint:check

code-format: ## Run all code formatting checks
	$(PNPM) run format
	$(PNPM) run lint

##@ Cleanup
clean: ## Remove build artifacts
	rm -rf dist/ .nest/
