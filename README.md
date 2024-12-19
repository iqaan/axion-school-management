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
Add the .env file with contents (fill the variable contents):
```
LONG_TOKEN_SECRET=
SHORT_TOKEN_SECRET=
NACL_SECRET=
MONGO_URI=
REDIS_URI=
```
You may omit `MONGO_URI` or `REDIS_URI` for localhost. Make sure mongoDB and redis are installed and running though.

To deploy this microservice, run:

```bash
npm run start
```

### Creating a Super Admin User
Before deploying to production, you'll need to create a super admin user. You can do this by running the following command in your terminal:

```bash
MONGO_URI='mongodb://your-mongo-uri' SUPER_ADMIN_EMAIL='superadmin@example.com' SUPER_ADMIN_PASSWORD='password123' node seed.mjs
```
