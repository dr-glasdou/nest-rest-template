.PHONY: help install setup build dev debug prod lint format format-check test test-watch test-cov test-e2e db-generate db-migrate db-push db-studio db-check

.DEFAULT_GOAL := help

BUN := bun
DRIZZLE := $(BUN) x drizzle-kit

##@ General
help: ## Show this help
	@awk 'BEGIN {FS = ":.*##"; printf "\nUsage:\n  make \033[36m<target>\033[0m\n"} /^[a-zA-Z_-]+:.*?##/ { printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2 } /^##@/ { printf "\n\033[1m%s\033[0m\n", substr($$0, 5) } ' $(MAKEFILE_LIST)

##@ Setup
setup: ## Clean install (remove node_modules + lock file + reinstall)
	@echo "⚠️  This will delete node_modules and bun.lock and reinstall all dependencies"
	@sleep 3
	rm -rf node_modules bun.lock
	$(BUN) install

install: ## Install dependencies
	$(BUN) install

##@ Development
build: ## Build the application
	$(BUN) run build

dev: ## Start the application in development mode with watch
	$(BUN) run start:dev

portless: ## Start the application in dev mode with portless
	$(BUN) run start:portless

debug: ## Start the application in debug mode
	$(BUN) run start:debug

prod: ## Start the application in production mode
	$(BUN) run start:prod

##@ Database
db-generate: ## Generate SQL migrations from schema (optional: name=auth)
	$(DRIZZLE) generate $(if $(name),--name $(name),)

db-migrate: ## Apply pending migrations
	$(DRIZZLE) migrate

db-push: ## Push schema to DB (no migration files)
	$(DRIZZLE) push

db-studio: ## Open Drizzle Studio
	$(DRIZZLE) studio

db-check: ## Validate migrations vs schema
	$(DRIZZLE) check

##@ Lint & Format
lint: ## Lint code (oxlint)
	$(BUN) run lint

format: ## Format code (oxfmt)
	$(BUN) run format

format-check: ## Check format without writing
	$(BUN) run format:check

##@ Test
test: ## Run unit tests
	$(BUN) run test

test-watch: ## Run unit tests in watch mode
	$(BUN) run test:watch

test-cov: ## Run unit tests with coverage
	$(BUN) run test:cov

test-e2e: ## Run e2e tests
	$(BUN) run test:e2e
