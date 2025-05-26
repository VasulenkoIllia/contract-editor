# Docker Setup Updates

This document outlines the updates made to the Docker configuration to ensure the project runs smoothly in Docker containers.

## Changes Made

1. **Updated Node.js Version**
   - Updated Node.js version from 16 to 20 in all Dockerfiles:
     - `backend/Dockerfile`
     - `frontend/Dockerfile`
     - `frontend/Dockerfile.dev`
   - Node.js 16 reached end-of-life in September 2023, so it's important to use a supported version.

2. **Fixed Nginx Configuration**
   - Removed an erroneous "deploy" text at the end of `frontend/nginx.conf` that could cause issues with Nginx.

3. **Updated Environment Variables**
   - Updated `backend/.env.example` to use `db` as the DB_HOST value instead of `localhost`, which is more appropriate for the Docker setup.

## Recommendations

1. **Environment Variables**
   - Ensure that the `.env` file in the project root and the `.env` file in the `backend` directory have consistent values, especially for DB_HOST.
   - For Docker Compose, DB_HOST should be set to `db` (the service name in docker-compose.yml).
   - For local development without Docker, DB_HOST should be set to `localhost`.

2. **Docker Compose Commands**
   - To start the application in production mode:
     ```bash
     docker-compose up -d
     ```
   - To start the application in development mode:
     ```bash
     docker-compose -f docker-compose.dev.yml up -d
     ```
   - To stop the application:
     ```bash
     docker-compose down
     ```
   - To rebuild the containers after making changes:
     ```bash
     docker-compose up -d --build
     ```

3. **Persistent Data**
   - The PostgreSQL data is stored in a Docker volume named `postgres_data`.
   - To preserve this data between container restarts, do not use the `-v` flag with `docker-compose down`.
   - To completely reset the database, use:
     ```bash
     docker-compose down -v
     ```

4. **Troubleshooting**
   - If you encounter issues with the database connection, ensure that the DB_HOST is set correctly in your environment files.
   - Check container logs for errors:
     ```bash
     docker-compose logs backend
     docker-compose logs frontend
     docker-compose logs db
     ```
   - Ensure that the database container is running before starting the backend:
     ```bash
     docker-compose ps
     ```

## Future Improvements

1. **Health Checks**
   - Add health checks to the docker-compose.yml file to ensure services start in the correct order.

2. **Multi-Stage Builds**
   - Consider using multi-stage builds for the backend Dockerfile to reduce image size.

3. **Docker Compose Profiles**
   - Consider using Docker Compose profiles to manage different environments (dev, test, prod) more efficiently.

4. **Container Security**
   - Run containers with non-root users for improved security.
   - Implement resource limits to prevent container resource exhaustion.
