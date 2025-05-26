# Running the Contract Editor with Docker

This guide explains how to set up and run the Contract Editor application using Docker.

## Prerequisites

- Docker and Docker Compose installed on your system
- Git (to clone the repository)

## Setup Instructions

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd contract-editor
   ```

2. **Start the application**

   ```bash
   docker-compose up -d
   ```

   This will start the following containers:
   - PostgreSQL database
   - Backend Node.js server
   - Frontend Nginx server

3. **Access the application**

   The application will be available at http://localhost

   The backend API will be available at http://localhost/api

## Environment Variables

You can customize the application by setting the following environment variables:

- `DB_USER`: Database username (default: postgres)
- `DB_PASSWORD`: Database password (default: postgres)
- `DB_NAME`: Database name (default: contract_editor)
- `DB_PORT`: Database port (default: 5432)

Example:
```bash
DB_USER=myuser DB_PASSWORD=mypassword docker-compose up -d
```

## Database Structure

The application uses a PostgreSQL database with the following main table:

### Counterparties

Stores information about counterparties (customers, performers) with the following fields:

- `id` - Primary key
- `company` - Company name
- `director` - Director name
- `documentName` - Document name
- `address` - Company address
- `bankAccount` - Bank account number
- `bank` - Bank name
- `bankCode` - Bank code
- `code` - Company code
- `individualCode` - Individual code
- `createdAt` - Creation timestamp
- `updatedAt` - Last update timestamp

## Stopping the Application

To stop all containers:

```bash
docker-compose down
```

To stop all containers and remove volumes (this will delete all data):

```bash
docker-compose down -v
```

## Development Mode

If you want to run the application in development mode (with hot reloading):

1. Use the provided docker-compose.dev.yml file:

   ```bash
   docker-compose -f docker-compose.dev.yml up -d
   ```

   This will start the following containers:
   - PostgreSQL database
   - Backend Node.js server in development mode
   - Frontend React development server

2. Access the application:

   The frontend will be available at http://localhost:3000
   The backend API will be available at http://localhost:5000/api

3. Make changes to the code:

   Any changes you make to the frontend or backend code will be automatically detected and the application will reload.

4. Stop the development containers:

   ```bash
   docker-compose -f docker-compose.dev.yml down
   ```
