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

2. **Start the database**

   ```bash
   docker-compose up -d
   ```

   This will start a PostgreSQL database container with the following configuration:
   - Database name: `contract_editor`
   - Username: `postgres`
   - Password: `postgres`
   - Port: `5432`

3. **Install backend dependencies**

   ```bash
   cd backend
   npm install
   ```

4. **Install frontend dependencies**

   ```bash
   cd ../frontend
   npm install
   ```

5. **Start the backend server**

   ```bash
   cd ../backend
   npm start
   ```

   The backend server will run on http://localhost:5000

6. **Start the frontend development server**

   ```bash
   cd ../frontend
   npm start
   ```

   The frontend application will be available at http://localhost:3000

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

1. Stop the frontend and backend servers by pressing `Ctrl+C` in their respective terminal windows.

2. Stop the database container:

   ```bash
   docker-compose down
   ```

   To remove the database volume as well (this will delete all data):

   ```bash
   docker-compose down -v
   ```
