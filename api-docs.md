# API Documentation

## Authentication Endpoints

### Sign Up
- **Route**: `POST /api/auth/signup`
- **Access**: Public
- **Description**: Register a new user (student or tutor)
- **Request Body**:
```json
{
    "username": "string",     // 3-20 characters
    "email": "string",       // valid email format
    "password": "string",    // 6-40 characters
    "role": "string"        // must be either "STUDENT" or "TUTOR"
}
```
- **Response (200 OK)**:
```json
{
    "token": "string",      // JWT token
    "username": "string"
}
```
- **Error Responses**:
  - `400 Bad Request`: Username/email already taken
  - `400 Bad Request`: Invalid input data

### Login
- **Route**: `POST /api/auth/login`
- **Access**: Public
- **Description**: Authenticate a user and get JWT token
- **Request Body**:
```json
{
    "username": "string",
    "password": "string"
}
```
- **Response (200 OK)**:
```json
{
    "token": "string",      // JWT token
    "username": "string"
}
```
- **Error Responses**:
  - `401 Unauthorized`: Invalid credentials

### Get Profile
- **Route**: `GET /api/auth/profile`
- **Access**: Authenticated users
- **Description**: Get current user's profile
- **Headers**: 
  - `Authorization: Bearer <jwt_token>`
- **Response (200 OK)**:
```json
{
    "id": "string",
    "username": "string",
    "email": "string",
    "role": "string",
    "fullname": "string",
    "phone": "string",
    "address": "string",
    "avatar": "string",
    "bio": "string"
}
```

### Update Profile
- **Route**: `PUT /api/auth/profile`
- **Access**: Authenticated users
- **Description**: Update current user's profile
- **Headers**: 
  - `Authorization: Bearer <jwt_token>`
- **Request Body**:
```json
{
    "fullname": "string",   // optional, 3-50 characters
    "email": "string",      // optional, valid email
    "phone": "string",      // optional, 10-15 characters
    "address": "string",    // optional
    "avatar": "string",     // optional
    "bio": "string"        // optional, max 500 characters
}
```
- **Response (200 OK)**: Updated user object

## Posts Endpoints

### Create Post
- **Route**: `POST /api/posts`
- **Access**: Authenticated tutors only
- **Description**: Create a new tutoring post
- **Headers**: 
  - `Authorization: Bearer <jwt_token>`
- **Request Body**:
```json
{
    "title": "string",         // 5-100 characters
    "description": "string",   // max 1000 characters
    "subject": "string",
    "location": "string",
    "schedule": "string",
    "visibility": "boolean",   // true for public, false for private
    "maxStudent": "number"     // minimum 1
}
```
- **Response (200 OK)**: Created post object
- **Error Responses**:
  - `403 Forbidden`: If user is not a tutor
  - `400 Bad Request`: If maxStudent is less than 1

### Get All Posts
- **Route**: `GET /api/posts`
- **Access**: Public
- **Description**: Get all tutoring posts
- **Response (200 OK)**:
```json
[
    {
        "id": "string",
        "userId": "string",
        "title": "string",
        "description": "string",
        "subject": "string",
        "location": "string",
        "schedule": "string",
        "createdAt": "string",
        "visibility": "boolean",
        "approvedStudent": "number",  // count of confirmed bookings
        "maxStudent": "number"        // maximum number of students allowed
    }
]
```

### Get Posts by Tutor
- **Route**: `GET /api/posts/tutor/{tutorId}`
- **Access**: Public
- **Description**: Get all posts by a specific tutor
- **Response (200 OK)**: Array of post objects

## Bookings Endpoints

### Create Booking
- **Route**: `POST /api/bookings`
- **Access**: Authenticated students only
- **Description**: Create a new booking for a post
- **Headers**: 
  - `Authorization: Bearer <jwt_token>`
- **Request Body**:
```json
{
    "postId": "string"
}
```
- **Response (200 OK)**:
```json
{
    "id": "string",
    "studentId": "string",
    "tutorId": "string",
    "postId": "string",
    "subject": "string",
    "schedule": "string",
    "status": "PENDING",
    "createdAt": "string"
}
```
- **Error Responses**:
  - `403 Forbidden`: If user is not a student
  - `404 Not Found`: If post doesn't exist

### Get My Bookings
- **Route**: `GET /api/bookings`
- **Access**: Authenticated users
- **Description**: Get current user's bookings (as student or tutor)
- **Headers**: 
  - `Authorization: Bearer <jwt_token>`
- **Response (200 OK)**:
```json
{
    "role": "string",          // "STUDENT" or "TUTOR"
    "userId": "string",
    "bookings": [
        {
            "id": "string",
            "studentId": "string",
            "tutorId": "string",
            "postId": "string",
            "subject": "string",
            "schedule": "string",
            "status": "string", // "PENDING", "CONFIRMED", "CANCELED", or "COMPLETED"
            "createdAt": "string"
        }
    ],
    "count": 0
}
```

### Update Booking Status
- **Route**: `PUT /api/bookings/{bookingId}/status`
- **Access**: Authenticated tutors only
- **Description**: Update the status of a booking
- **Headers**: 
  - `Authorization: Bearer <jwt_token>`
- **Query Parameters**:
  - `status`: One of ["PENDING", "CONFIRMED", "CANCELED", "COMPLETED"]
- **Response (200 OK)**: Updated booking object
- **Error Responses**:
  - `403 Forbidden`: If user is not the tutor of this booking
  - `404 Not Found`: If booking doesn't exist

## Reviews Endpoints

### Create Review
- **Route**: `POST /api/reviews`
- **Access**: Authenticated students only
- **Description**: Create a review for a completed booking
- **Headers**: 
  - `Authorization: Bearer <jwt_token>`
- **Request Body**:
```json
{
    "bookingId": "string",
    "rating": "number",      // float between 1.0 and 5.0
    "comment": "string"      // max 500 characters
}
```
- **Response (200 OK)**:
```json
{
    "id": "string",
    "bookingId": "string",
    "rating": "number",
    "comment": "string",
    "createdAt": "string"
}
```
- **Error Responses**:
  - `403 Forbidden`: If user is not a student
  - `403 Forbidden`: If user is not the student of this booking
  - `400 Bad Request`: If booking is not in COMPLETED status
  - `400 Bad Request`: If review already exists for this booking
  - `404 Not Found`: If booking doesn't exist

### Get Reviews by Tutor
- **Route**: `GET /api/reviews/tutor/{tutorId}`
- **Access**: Public
- **Description**: Get all reviews for a specific tutor
- **Response (200 OK)**:
```json
[
    {
        "id": "string",
        "bookingId": "string",
        "rating": "number",
        "comment": "string",
        "createdAt": "string",
        "student": {
            "id": "string",
            "username": "string",
            "avatar": "string"
        }
    }
]
```

### Get Reviews by Booking
- **Route**: `GET /api/reviews/booking/{bookingId}`
- **Access**: Authenticated users
- **Description**: Get review for a specific booking
- **Headers**: 
  - `Authorization: Bearer <jwt_token>`
- **Response (200 OK)**:
```json
{
    "id": "string",
    "bookingId": "string",
    "rating": "number",
    "comment": "string",
    "createdAt": "string",
    "student": {
        "id": "string",
        "username": "string",
        "avatar": "string"
    }
}
```
- **Error Responses**:
  - `403 Forbidden`: If user is not associated with this booking
  - `404 Not Found`: If review or booking doesn't exist

## General Information

### Authentication
- All authenticated endpoints require a valid JWT token in the Authorization header
- Format: `Authorization: Bearer <jwt_token>`
- Token is obtained from login or signup response

### Error Responses
All endpoints may return these common errors:
- `400 Bad Request`: Invalid input data
- `401 Unauthorized`: Missing or invalid JWT token
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `500 Internal Server Error`: Server error

### Date Format
All dates are returned in ISO-8601 format: `YYYY-MM-DDTHH:mm:ss.sssZ`