# NutriVoice Deployment Guide

## Table of Contents
1. Prerequisites
2. Environment Configuration
3. Docker Deployment
4. Traditional VPS Deployment
5. AWS Serverless Deployment
6. Database Setup
7. Monitoring and Logging
8. Backup and Recovery
9. Troubleshooting

---

## 1. Prerequisites

### Required Software
- Docker 20.10+ and Docker Compose 2.0+
- Node.js 18+ (for frontend)
- Bun 1.0+ (for backend)
- MySQL 8.0+
- Redis 7+ (optional but recommended)

### AWS Account Setup
- AWS account with Bedrock access
- IAM user with permissions for:
  - Amazon Bedrock (Nova models)
  - CloudWatch Logs (optional)
- Access key and secret key

### Domain and SSL (Production)
- Domain name registered
- SSL certificate (Let's Encrypt recommended)
- DNS configured

---

## 2. Environment Configuration

### Backend Environment Variables

Create `backend/.env`:

```env
# Server Configuration
NODE_ENV=production
PORT=3001

# Database Configuration
DATABASE_HOST=your-mysql-host
DATABASE_PORT=3306
DATABASE_NAME=nutrivoice_prod
DATABASE_USER=nutrivoice
DATABASE_PASSWORD=your-secure-password

# Redis Configuration
REDIS_HOST=your-redis-host
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password

# Security (CHANGE THESE!)
JWT_SECRET=your-very-long-random-jwt-secret-min-32-chars
TOTP_ENCRYPTION_KEY=your-very-long-encryption-key-min-32-chars

# AWS Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key-id
AWS_SECRET_ACCESS_KEY=your-secret-access-key

# Rate Limiting
RATE_LIMIT_LOGIN=5
RATE_LIMIT_SIGNUP=3
RATE_LIMIT_TOTP=10

# Session Configuration
SESSION_TIMEOUT_MINUTES=30

# Logging
LOG_LEVEL=info
```

### Frontend Environment Variables

Create `frontend/.env.production`:

```env
# API Configuration
NEXT_PUBLIC_API_URL=https://api.yourdomain.com

# Environment
NEXT_PUBLIC_ENV=production
```

### Generating Secure Secrets

```bash
# Generate JWT secret (32+ characters)
openssl rand -base64 32

# Generate TOTP encryption key (32+ characters)
openssl rand -base64 32
```

---

## 3. Docker Deployment

### 3.1 Quick Start with Docker Compose


**Step 1: Clone Repository**
```bash
git clone https://github.com/yourusername/nutrivoice.git
cd nutrivoice
```

**Step 2: Configure Environment**
```bash
# Copy example files
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.production

# Edit with your values
nano backend/.env
nano frontend/.env.production
```

**Step 3: Build and Start Services**
```bash
# Build images
docker-compose build

# Start all services
docker-compose up -d

# Check status
docker-compose ps
```

**Step 4: Run Database Migrations**
```bash
# Run migrations
docker-compose exec backend bun run db:migrate

# (Optional) Seed test data
docker-compose exec backend bun run db:seed
```

**Step 5: Verify Deployment**
```bash
# Check logs
docker-compose logs -f

# Test frontend
curl http://localhost:3000

# Test backend
curl http://localhost:3001/health
```

### 3.2 Production Docker Compose

Create `docker-compose.prod.yml`:

```yaml
version: '3.8'

services:
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
      target: runner
    container_name: nutrivoice-frontend-prod
    restart: always
    ports:
      - "3000:3000"
    environment:
      NODE_ENV: production
      NEXT_PUBLIC_API_URL: https://api.yourdomain.com
    depends_on:
      - backend

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: nutrivoice-backend-prod
    restart: always
    ports:
      - "3001:3001"
    env_file:
      - ./backend/.env
    depends_on:
      mysql:
        condition: service_healthy
      redis:
is:
    image: redis:7-alpine
    container_name: nutrivoice-redis-prod
    restart: always
    command: redis-server --requirepass ${REDIS_PASSWORD} --appendonly yes
    ports:
      - "6379:6379"
    volumes:
      - redis_prod_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "--raw", "incr", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  nginx:
    image: nginx:alpine
    container_name: nutrivoice-nginx
    restart: always
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
    depends_on:
      - frontend
      - backend

volumes:
  mysql_prod_data:
  redis_prod_data:
```

### 3.3 Nginx Configuration

Create `nginx.conf`:

```nginx
events {
    worker_connections 1024;
}

http {
    upstream frontend {
        server frontend:3000;
    }

    upstream backend {
        server backend:3001;
    }

    # Redirect HTTP to HTTPS
    server {
        listen 80;
        server_name yourdomain.com www.yourdomain.com;
        return 301 https://$server_name$request_uri;
    }

    # HTTPS Server
    server {
        listen 443 ssl http2;
        server_name yourdomain.com www.yourdomain.com;

        ssl_certificate /etc/nginx/ssl/fullchain.pem;
        ssl_certificate_key /etc/nginx/ssl/privkey.pem;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers HIGH:!aNULL:!MD5;

        # Security headers
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
        add_header X-Frame-Options "DENY" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;

        # Frontend
        location / {
            proxy_pass http://frontend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
        }

        # Backend API
        location /api {
            proxy_pass http://backend;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
}
```

---

## 4. Traditional VPS Deployment

### 4.1 Server Requirements

**Minimum Specifications:**
- 2 CPU cores
- 4GB RAM
- 20GB SSD storage
- Ubuntu 22.04 LTS or similar

**Recommended Specifications:**
- 4 CPU cores
- 8GB RAM
- 50GB SSD storage

### 4.2 Server Setup

**Step 1: Update System**
```bash
sudo apt update && sudo apt upgrade -y
```

**Step 2: Install Dependencies**
```bash
# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install Bun
curl -fsSL https://bun.sh/install | bash

# Install MySQL
sudo apt install -y mysql-server

# Install Redis
sudo apt install -y redis-server

# Install Nginx
sudo apt install -y nginx

# Install PM2 for process management
sudo npm install -g pm2
```

**Step 3: Configure MySQL**
```bash
sudo mysql_secure_installation

# Create database and user
sudo mysql -u root -p
```

```sql
CREATE DATABASE nutrivoice_prod;
CREATE USER 'nutrivoice'@'localhost' IDENTIFIED BY 'your-secure-password';
GRANT ALL PRIVILEGES ON nutrivoice_prod.* TO 'nutrivoice'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

**Step 4: Configure Redis**
```bash
sudo nano /etc/redis/redis.conf
```

Add/modify:
```
requirepass your-redis-password
maxmemory 256mb
maxmemory-policy allkeys-lru
```

Restart Redis:
```bash
sudo systemctl restart redis
sudo systemctl enable redis
```

### 4.3 Application Deployment

**Step 1: Clone and Build**
```bash
cd /var/www
sudo git clone https://github.com/yourusername/nutrivoice.git
cd nutrivoice

# Install dependencies
npm install
cd frontend && npm install && npm run build
cd ../backend && bun install
cd ../shared && npm install && npm run build
```

**Step 2: Configure Environment**
```bash
cp backend/.env.example backend/.env
nano backend/.env
# Fill in production values
```

**Step 3: Run Migrations**
```bash
cd backend
bun run db:migrate
```

**Step 4: Start with PM2**
```bash
# Start backend
cd /var/www/nutrivoice/backend
pm2 start bun --name nutrivoice-backend -- run start

# Start frontend
cd /var/www/nutrivoice/frontend
pm2 start npm --name nutrivoice-frontend -- start

# Save PM2 configuration
pm2 save
pm2 startup
```

**Step 5: Configure Nginx**
```bash
sudo nano /etc/nginx/sites-available/nutrivoice
```

Use the nginx configuration from section 3.3, then:
```bash
sudo ln -s /etc/nginx/sites-available/nutrivoice /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

**Step 6: Setup SSL with Let's Encrypt**
```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

---

## 5. AWS Serverless Deployment

### 5.1 Architecture Overview

```
CloudFront (CDN)
    |
    +---> S3 (Frontend Static Files)
    |
    +---> API Gateway
            |
            v
        Lambda Functions (Backend)
            |
            +---> RDS MySQL
            |
            +---> ElastiCache Redis
            |
            +---> Bedrock (Nova Models)
```

### 5.2 Frontend Deployment (S3 + CloudFront)

**Step 1: Build Frontend**
```bash
cd frontend
npm run build
```

**Step 2: Create S3 Bucket**
```bash
aws s3 mb s3://nutrivoice-frontend
aws s3 website s3://nutrivoice-frontend --index-document index.html
```

**Step 3: Upload Build**
```bash
aws s3 sync out/ s3://nutrivoice-frontend --delete
```

**Step 4: Create CloudFront Distribution**
```bash
aws cloudfront create-distribution \
  --origin-domain-name nutrivoice-frontend.s3.amazonaws.com \
  --default-root-object index.html
```

### 5.3 Backend Deployment (Lambda)

**Step 1: Install Serverless Framework**
```bash
npm install -g serverless
```

**Step 2: Create serverless.yml**
```yaml
service: nutrivoice-backend

provider:
  name: aws
  runtime: nodejs18.x
  region: us-east-1
  environment:
    DATABASE_HOST: ${env:DATABASE_HOST}
    DATABASE_NAME: nutrivoice_prod
    DATABASE_USER: ${env:DATABASE_USER}
    DATABASE_PASSWORD: ${env:DATABASE_PASSWORD}
    REDIS_HOST: ${env:REDIS_HOST}
    JWT_SECRET: ${env:JWT_SECRET}

functions:
  api:
    handler: src/lambda.handler
    events:
      - httpApi: '*'
```

**Step 3: Deploy**
```bash
cd backend
serverless deploy
```

### 5.4 Database Setup (RDS)

```bash
aws rds create-db-instance \
  --db-instance-identifier nutrivoice-db \
  --db-instance-class db.t3.micro \
  --engine mysql \
  --master-username admin \
  --master-user-password your-password \
  --allocated-storage 20
```

---

## 6. Database Setup

### 6.1 Running Migrations

**Docker:**
```bash
docker-compose exec backend bun run db:migrate
```

**VPS:**
```bash
cd /var/www/nutrivoice/backend
bun run db:migrate
```

### 6.2 Database Backup

**Manual Backup:**
```bash
mysqldump -u nutrivoice -p nutrivoice_prod > backup_$(date +%Y%m%d).sql
```

**Automated Backup Script:**
```bash
#!/bin/bash
# /usr/local/bin/backup-nutrivoice.sh

BACKUP_DIR="/var/backups/nutrivoice"
DATE=$(date +%Y%m%d_%H%M%S)
FILENAME="nutrivoice_backup_$DATE.sql"

mkdir -p $BACKUP_DIR
mysqldump -u nutrivoice -p$DB_PASSWORD nutrivoice_prod > $BACKUP_DIR/$FILENAME
gzip $BACKUP_DIR/$FILENAME

# Keep only last 7 days
find $BACKUP_DIR -name "*.sql.gz" -mtime +7 -delete
```

**Setup Cron Job:**
```bash
sudo crontab -e
```

Add:
```
0 2 * * * /usr/local/bin/backup-nutrivoice.sh
```

---

## 7. Monitoring and Logging

### 7.1 Application Monitoring

**PM2 Monitoring:**
```bash
pm2 monit
pm2 logs
pm2 status
```

**Docker Monitoring:**
```bash
docker stats
docker-compose logs -f
```

### 7.2 Log Management

**Centralized Logging (Optional):**
```bash
# Install Filebeat
curl -L -O https://artifacts.elastic.co/downloads/beats/filebeat/filebeat-8.0.0-amd64.deb
sudo dpkg -i filebeat-8.0.0-amd64.deb

# Configure to send logs to ELK stack or CloudWatch
```

### 7.3 Health Checks

**Backend Health Endpoint:**
```bash
curl http://localhost:3001/health
```

**Automated Health Check Script:**
```bash
#!/bin/bash
# /usr/local/bin/health-check.sh

BACKEND_URL="http://localhost:3001/health"
FRONTEND_URL="http://localhost:3000"

if ! curl -f $BACKEND_URL > /dev/null 2>&1; then
    echo "Backend is down!"
    pm2 restart nutrivoice-backend
fi

if ! curl -f $FRONTEND_URL > /dev/null 2>&1; then
    echo "Frontend is down!"
    pm2 restart nutrivoice-frontend
fi
```

---

## 8. Backup and Recovery

### 8.1 Full System Backup

**What to Backup:**
- Database (MySQL dumps)
- Redis data (if persistent)
- Environment files (.env)
- SSL certificates
- Application code (git repository)

**Backup Script:**
```bash
#!/bin/bash
BACKUP_ROOT="/var/backups/nutrivoice"
DATE=$(date +%Y%m%d_%H%M%S)

# Database
mysqldump -u nutrivoice -p$DB_PASSWORD nutrivoice_prod | gzip > $BACKUP_ROOT/db_$DATE.sql.gz

# Redis
redis-cli --rdb $BACKUP_ROOT/redis_$DATE.rdb

# Environment files
tar -czf $BACKUP_ROOT/config_$DATE.tar.gz /var/www/nutrivoice/backend/.env

# Upload to S3 (optional)
aws s3 sync $BACKUP_ROOT s3://nutrivoice-backups/
```

### 8.2 Disaster Recovery

**Database Restore:**
```bash
gunzip < backup.sql.gz | mysql -u nutrivoice -p nutrivoice_prod
```

**Redis Restore:**
```bash
sudo systemctl stop redis
sudo cp backup.rdb /var/lib/redis/dump.rdb
sudo chown redis:redis /var/lib/redis/dump.rdb
sudo systemctl start redis
```

**Application Restore:**
```bash
cd /var/www
sudo rm -rf nutrivoice
sudo git clone https://github.com/yourusername/nutrivoice.git
cd nutrivoice
# Follow deployment steps
```

---

## 9. Troubleshooting

### Common Issues

**Issue: Backend won't start**
```bash
# Check logs
pm2 logs nutrivoice-backend

# Common causes:
# - Database connection failed
# - Missing environment variables
# - Port already in use

# Solutions:
# - Verify DATABASE_HOST and credentials
# - Check .env file
# - Kill process on port 3001: sudo lsof -ti:3001 | xargs kill -9
```

**Issue: Frontend build fails**
```bash
# Clear cache and rebuild
cd frontend
rm -rf .next node_modules
npm install
npm run build
```

**Issue: Database connection timeout**
```bash
# Check MySQL is running
sudo systemctl status mysql

# Check firewall
sudo ufw status
sudo ufw allow 3306

# Test connection
mysql -h localhost -u nutrivoice -p
```

**Issue: Redis connection failed**
```bash
# Check Redis is running
sudo systemctl status redis

# Test connection
redis-cli ping

# Check password
redis-cli -a your-password ping
```

**Issue: SSL certificate expired**
```bash
# Renew Let's Encrypt certificate
sudo certbot renew
sudo systemctl reload nginx
```

### Performance Issues

**High CPU Usage:**
```bash
# Check processes
top
htop

# Restart services
pm2 restart all
```

**High Memory Usage:**
```bash
# Check memory
free -h

# Clear Redis cache
redis-cli FLUSHALL

# Restart services
pm2 restart all
```

**Slow Database Queries:**
```bash
# Enable slow query log
sudo nano /etc/mysql/mysql.conf.d/mysqld.cnf

# Add:
slow_query_log = 1
slow_query_log_file = /var/log/mysql/slow-query.log
long_query_time = 2

# Restart MySQL
sudo systemctl restart mysql

# Analyze slow queries
sudo mysqldumpslow /var/log/mysql/slow-query.log
```

---

## Security Checklist

- [ ] Change all default passwords
- [ ] Generate strong JWT and encryption secrets
- [ ] Enable firewall (ufw or iptables)
- [ ] Configure SSL/TLS certificates
- [ ] Set up automated backups
- [ ] Enable fail2ban for SSH protection
- [ ] Configure rate limiting
- [ ] Set up monitoring and alerts
- [ ] Review and update dependencies regularly
- [ ] Enable database encryption at rest
- [ ] Configure Redis password
- [ ] Restrict database access to localhost
- [ ] Set up log rotation
- [ ] Configure CORS properly
- [ ] Enable security headers

---

## Maintenance Tasks

**Daily:**
- Monitor application logs
- Check system resources
- Verify backups completed

**Weekly:**
- Review error logs
- Check disk space
- Update dependencies (if needed)

**Monthly:**
- Security updates
- Performance review
- Backup verification
- SSL certificate check

---

## Support and Resources

- Documentation: https://docs.nutrivoice.com
- GitHub Issues: https://github.com/yourusername/nutrivoice/issues
- Email: support@nutrivoice.com

---

**Deployment complete! Your NutriVoice application should now be running in production.**
