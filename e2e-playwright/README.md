# Running end-to-end tests

Run the E2E tests with the command `docker compose run --rm --entrypoint=npx e2e-playwright playwright test`. If facing issues, try building the application again with the command `docker compose up --build`.