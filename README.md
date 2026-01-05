# PostgreSQL Backend API with AWS S3 File Upload

A production-ready Node.js/Express backend application with PostgreSQL database, JWT authentication, and AWS S3 file upload functionality.

## Features

- ✅ User Authentication (Register/Login with JWT)
- ✅ AWS S3 File Upload with validation
- ✅ PostgreSQL database with Sequelize ORM
- ✅ TypeScript for type safety
- ✅ Environment-based configuration
- ✅ File validation (MIME type, size, extension)
- ✅ Structured logging
- ✅ Error handling middleware

## Prerequisites

- Node.js (v16 or higher)
- PostgreSQL database
- AWS account with S3 bucket configured

## Installation

1. Clone the repository
```bash
git clone <repository-url>
cd postgresql
```

2. Install dependencies
```bash
npm install
```

3. Configure environment variables (see [Environment Setup](#environment-setup))

4. Run the application
```bash
npm run dev
```

## Environment Setup

Create a `.env` file in the root directory with the following variables:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Database Configuration
PG_DIALECT=postgres
PG_HOST=localhost
PG_PORT=5432
PG_USER=your_db_user
PG_PASSWORD=your_db_password
PG_DATABASE=your_db_name

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_here

# AWS S3 Configuration
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=us-east-1
AWS_S3_BUCKET_NAME=your_bucket_name
```

### AWS S3 Setup

1. **Create an S3 Bucket:**
   - Go to [AWS S3 Console](https://console.aws.amazon.com/s3/)
   - Click "Create bucket"
   - Choose a unique bucket name
   - Select your preferred region
   - Configure bucket permissions (ensure public read access if needed)

2. **Create IAM User:**
   - Go to [AWS IAM Console](https://console.aws.amazon.com/iam/)
   - Create a new user with programmatic access
   - Attach the `AmazonS3FullAccess` policy (or create a custom policy with minimum required permissions)
   - Save the Access Key ID and Secret Access Key

3. **Bucket Permissions:**
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Effect": "Allow",
         "Principal": "*",
         "Action": "s3:GetObject",
         "Resource": "arn:aws:s3:::your-bucket-name/*"
       }
     ]
   }
   ```

## Available Scripts

```bash
npm run dev        # Run development server with .env
npm run stage      # Run staging server with .env.stage
npm run prod       # Run production server with .env.prod
npm run build      # Build TypeScript to JavaScript
```

## API Endpoints

### Health Check
```
GET /health
Response: { success: true, message: "Server is up and running" }
```

### Authentication

#### Register User
```
POST /auth/register
Body: {
  "username": "string",
  "email": "string",
  "password": "string"
}
Response: { data: {...}, message: "User registered successfully", statusCode: 201 }
```

#### Login User
```
POST /auth/login
Body: {
  "email": "string",
  "password": "string"
}
Response: { data: "jwt_token", message: "User logged in successfully", statusCode: 200 }
```

#### Get All Users
```
GET /auth/users?pageNum=1&pageLimit=10&search=query
Headers: { Authorization: "Bearer <token>" }
Response: { data: { users: [...], page: 1, limit: 10, totalRecords: 100 } }
```

### File Upload (AWS S3)

#### Upload File
```
POST /assets/upload
Headers: { 
  Authorization: "Bearer <token>",
  Content-Type: "multipart/form-data"
}
Body: FormData with "file" field
Response: {
  success: true,
  message: "File uploaded successfully",
  file: {
    key: "uploads/1234567890-filename.jpg",
    url: "https://bucket.s3.region.amazonaws.com/uploads/1234567890-filename.jpg",
    bucket: "your-bucket-name",
    originalName: "filename.jpg",
    mimetype: "image/jpeg",
    size: 12345
  }
}
```

#### Delete File
```
DELETE /assets/delete
Headers: { Authorization: "Bearer <token>" }
Body: { "fileKey": "uploads/1234567890-filename.jpg" }
Response: { success: true, message: "File deleted successfully" }
```

## File Upload Restrictions

- **Allowed Image Types:** JPEG, JPG, PNG, GIF, WebP, SVG
- **Allowed Document Types:** PDF, DOC, DOCX, XLS, XLSX, TXT, CSV
- **Allowed Video Types:** MP4, MPEG, MOV, AVI, WebM
- **Max File Size:** 5MB for images/documents, 50MB for videos

## Project Structure

```
postgresql/
├── src/
│   ├── config/          # Configuration files (database, S3)
│   ├── constant/        # Constants and DTOs
│   ├── controllers/     # Route controllers
│   ├── middleware/      # Express middleware
│   ├── models/          # Sequelize models
│   ├── routes/          # API routes
│   ├── service/         # Business logic services
│   ├── types/           # TypeScript type definitions
│   ├── utils/           # Utility functions
│   ├── validators/      # Input validation
│   └── app.ts           # Application entry point
├── .env                 # Environment variables (not in git)
├── .env.example         # Environment template
├── package.json         # Dependencies
└── tsconfig.json        # TypeScript configuration
```

## Technologies Used

- **Runtime:** Node.js
- **Framework:** Express.js
- **Language:** TypeScript
- **Database:** PostgreSQL
- **ORM:** Sequelize with sequelize-typescript
- **Authentication:** JWT (jsonwebtoken)
- **Password Hashing:** bcrypt
- **File Upload:** Multer + AWS S3 SDK
- **Validation:** Yup
- **CORS:** cors

## Security Best Practices Implemented

- ✅ Password hashing with bcrypt
- ✅ JWT token-based authentication
- ✅ File type and size validation
- ✅ Environment variable configuration
- ✅ CORS enabled
- ✅ Error handling middleware
- ✅ Unique indexes on email and username
- ✅ Paranoid deletion (soft delete)

## Development Notes

- Uses TypeScript strict mode for type safety
- Implements decorators for Sequelize models
- Uses memory storage for file uploads (files go directly to S3)
- Structured logging with timestamps
- Comprehensive file validation before upload

## Troubleshooting

### Database Connection Issues
- Verify PostgreSQL is running
- Check database credentials in `.env`
- Ensure database exists

### AWS S3 Upload Issues
- Verify AWS credentials are correct
- Check S3 bucket name and region
- Ensure IAM user has S3 permissions
- Verify bucket CORS configuration if accessing from browser

### TypeScript Compilation Errors
- Run `npm install` to ensure all dependencies are installed
- Check `tsconfig.json` settings
- Ensure all type definitions are installed

## License

ISC

## Author

Your Name
