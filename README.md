# School Management System Microservice
## Overview
This token authentication microservice is part of the School Management System.

## Features
### Token-Based Authentication
This system provides token-based authentication for protecting routes in your application.

## Dependencies
* Node.js
* Redis
* MongoDB (as database)
## How to Run
To deploy this microservice, run:

```bash
npm run start
```

### Creating a Super Admin User
Before deploying to production, you'll need to create a super admin user. You can do this by running the following command in your terminal:

```bash
MONGO_URI='mongodb://your-mongo-uri' SUPER_ADMIN_EMAIL='superadmin@example.com' SUPER_ADMIN_PASSWORD='password123' node seed.mjs
```
