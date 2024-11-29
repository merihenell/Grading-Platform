# Running the application

Before running the application, remember to update the database credentials in `project-template.env` and rename it to `project.env`. Then build the grader image with the command `docker build -t grader-image .` within the `grader-image` folder. Within the root folder, run the application with development configuration with the command `docker compose up --build` or with production configuration with the command `docker compose -f docker-compose.prod.yml up -d`. If running for the first time, use `docker compose -f docker-compose.prod.yml --profile migrate up -d`.

See `e2e-playwright` and `k6` folders for instructions on running some end-to-end and performance tests.