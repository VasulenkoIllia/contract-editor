# Deploying Contract Editor on a VPS Server

This guide provides step-by-step instructions for deploying the Contract Editor application on a Virtual Private Server (VPS).

## Prerequisites

- A VPS with at least 2GB RAM and 1 CPU core
- Ubuntu 20.04 LTS or later (recommended)
- Root access to the server
- A domain name (optional, but recommended for production use)

## 1. Initial Server Setup

### 1.1. Connect to Your VPS

```bash
ssh root@your_server_ip
```

### 1.2. Update System Packages

```bash
apt update && apt upgrade -y
```

### 1.3. Create a New User with Administrative Privileges

```bash
adduser deploy
usermod -aG sudo deploy
```

### 1.4. Set Up SSH Keys for the New User

On your local machine, generate SSH keys if you don't have them already:

```bash
ssh-keygen -t rsa -b 4096
```

Copy your public key to the server:

```bash
ssh-copy-id deploy@your_server_ip
```

### 1.5. Configure SSH

Edit the SSH configuration file:

```bash
sudo nano /etc/ssh/sshd_config
```

Make the following changes:
- Change the default SSH port (optional but recommended)
- Disable root login: `PermitRootLogin no`
- Allow only key-based authentication: `PasswordAuthentication no`

Restart SSH service:

```bash
sudo systemctl restart sshd
```

### 1.6. Set Up a Basic Firewall

```bash
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

## 2. Install Required Software

### 2.1. Install Docker

```bash
sudo apt install apt-transport-https ca-certificates curl software-properties-common -y
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -
sudo add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable"
sudo apt update
sudo apt install docker-ce -y
```

Add your user to the docker group:

```bash
sudo usermod -aG docker deploy
```

### 2.2. Install Docker Compose

```bash
sudo curl -L "https://github.com/docker/compose/releases/download/v2.18.1/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### 2.3. Install Git

```bash
sudo apt install git -y
```

### 2.4. Install Node.js and npm (for build processes)

```bash
curl -sL https://deb.nodesource.com/setup_16.x | sudo -E bash -
sudo apt install nodejs -y
```

## 3. Clone and Configure the Application

### 3.1. Clone the Repository

```bash
mkdir -p /var/www
cd /var/www
git clone https://github.com/your-username/contract-editor.git
cd contract-editor
```

### 3.2. Create Environment Files

The project uses a `.env` file for environment variables. An example file (`.env.example`) is provided in the repository.

Copy the example file to create your own `.env` file:

```bash
cp backend/.env.example backend/.env
```

Edit the `.env` file to set your production values:

```bash
nano backend/.env
```

Add the following content, adjusting values as needed:

```
# Database Configuration
DB_NAME=contract_editor
DB_USER=postgres
DB_PASSWORD=postgres
DB_HOST=db
DB_PORT=5432

# Server Configuration
PORT=5000
NODE_ENV=production
```

### 3.3. Update Docker Compose Configuration

Edit the docker-compose.yml file to include production settings:

```bash
nano docker-compose.yml
```

Replace the content with:

```yaml
version: '3.8'

services:
  db:
    image: postgres:14
    container_name: contract-editor-db
    restart: always
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: contract_editor
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - app-network

  backend:
    build:
      context: ./backend
    container_name: contract-editor-backend
    restart: always
    depends_on:
      - db
    environment:
      - NODE_ENV=production
      - PORT=5000
      - DB_HOST=db
      - DB_PORT=5432
      - DB_NAME=contract_editor
      - DB_USER=postgres
      - DB_PASSWORD=postgres
    volumes:
      - ./backend/uploads:/app/uploads
    networks:
      - app-network

  frontend:
    build:
      context: ./frontend
      args:
        - REACT_APP_API_URL=/api
    container_name: contract-editor-frontend
    restart: always
    depends_on:
      - backend
    networks:
      - app-network

  nginx:
    image: nginx:alpine
    container_name: contract-editor-nginx
    restart: always
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/conf.d:/etc/nginx/conf.d
      - ./nginx/ssl:/etc/nginx/ssl
      - ./frontend/build:/usr/share/nginx/html
    depends_on:
      - backend
      - frontend
    networks:
      - app-network

networks:
  app-network:
    driver: bridge

volumes:
  postgres_data:
```

### 3.4. Create Dockerfile for Backend

Create a Dockerfile in the backend directory:

```bash
mkdir -p backend
nano backend/Dockerfile
```

Add the following content:

```dockerfile
FROM node:16-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install --production

COPY . .

EXPOSE 5000

CMD ["node", "server.js"]
```

### 3.5. Create Dockerfile for Frontend

Create a Dockerfile in the frontend directory:

```bash
mkdir -p frontend
nano frontend/Dockerfile
```

Add the following content:

```dockerfile
FROM node:16-alpine as build

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

ARG REACT_APP_API_URL
ENV REACT_APP_API_URL=${REACT_APP_API_URL}

RUN npm run build

FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### 3.6. Configure Nginx

Create the Nginx configuration directory and file:

```bash
mkdir -p nginx/conf.d
nano nginx/conf.d/default.conf
```

Add the following content:

```nginx
server {
    listen 80;
    server_name _;

    location / {
        root /usr/share/nginx/html;
        index index.html index.htm;
        try_files $uri $uri/ /index.html;
    }

    location /api {
        rewrite ^/api(/.*)$ $1 break;
        proxy_pass http://backend:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 4. Build and Deploy the Application

### 4.1. Build the Docker Images and Start the Containers

```bash
cd /var/www/contract-editor
docker-compose up -d
```

### 4.2. Check if the Containers are Running

```bash
docker-compose ps
```

## 5. Set Up SSL/TLS with Let's Encrypt (Optional but Recommended)

### 5.1. Install Certbot

```bash
sudo apt install certbot python3-certbot-nginx -y
```

### 5.2. Obtain SSL Certificate

```bash
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

Follow the prompts to complete the certificate setup.

### 5.3. Update Nginx Configuration

Certbot will automatically update your Nginx configuration. Verify it:

```bash
cat nginx/conf.d/default.conf
```

### 5.4. Set Up Auto-renewal

Certbot creates a cron job automatically, but you can verify it:

```bash
sudo systemctl status certbot.timer
```

## 6. Maintenance and Updates

### 6.1. Updating the Application

To update the application with the latest changes from the repository:

```bash
cd /var/www/contract-editor
git pull
docker-compose down
docker-compose up -d --build
```

### 6.2. Backing Up the Database

Create a script for regular database backups:

```bash
nano /var/www/backup-db.sh
```

Add the following content:

```bash
#!/bin/bash
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="/var/www/backups"
mkdir -p $BACKUP_DIR
docker exec contract-editor-db pg_dump -U postgres contract_editor > $BACKUP_DIR/contract_editor_$TIMESTAMP.sql
```

Make the script executable:

```bash
chmod +x /var/www/backup-db.sh
```

Set up a cron job to run the backup script daily:

```bash
crontab -e
```

Add the following line:

```
0 2 * * * /var/www/backup-db.sh
```

## 7. Monitoring and Logging

### 7.1. View Container Logs

```bash
# View logs for all containers
docker-compose logs

# View logs for a specific container
docker-compose logs backend
docker-compose logs frontend
docker-compose logs db
```

### 7.2. Set Up Log Rotation

Create a logrotate configuration file:

```bash
sudo nano /etc/logrotate.d/docker-container
```

Add the following content:

```
/var/lib/docker/containers/*/*.log {
    daily
    rotate 7
    compress
    delaycompress
    missingok
    copytruncate
}
```

## 8. Troubleshooting

### 8.1. Container Issues

If a container is not starting properly:

```bash
# Check container status
docker-compose ps

# View detailed container logs
docker-compose logs [container_name]

# Restart a specific container
docker-compose restart [container_name]

# Rebuild and restart all containers
docker-compose down
docker-compose up -d --build
```

### 8.2. Database Connection Issues

If the application cannot connect to the database:

1. Check if the database container is running:
   ```bash
   docker-compose ps db
   ```

2. Verify database credentials in the `.env` file and `docker-compose.yml`

3. Connect to the database container and check PostgreSQL logs:
   ```bash
   docker exec -it contract-editor-db bash
   cat /var/log/postgresql/postgresql-14-main.log
   ```

### 8.3. Nginx Configuration Issues

If you're having issues with the Nginx configuration:

1. Check Nginx logs:
   ```bash
   docker-compose logs nginx
   ```

2. Verify the Nginx configuration:
   ```bash
   docker exec -it contract-editor-nginx nginx -t
   ```

## Conclusion

Your Contract Editor application should now be successfully deployed on your VPS. The application is running in Docker containers with Nginx as a reverse proxy, and optionally with SSL/TLS encryption.

For any issues or questions, please refer to the troubleshooting section or contact the development team.
