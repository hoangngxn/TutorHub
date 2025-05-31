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
    "role": "string"        // must be either "STUDENT", "TUTOR", or "ADMIN"
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
    "bio": "string",
    "createdAt": "string"
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

### Get User by ID
- **Route**: `GET /api/auth/users/{userId}`
- **Access**: Public
- **Description**: Get a user's profile by their ID
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
    "bio": "string",
    "createdAt": "string"
}
```
- **Error Responses**:
  - `404 Not Found`: If user with the specified ID doesn't exist

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
    "schedules": [            // List of weekly schedules
        {
            "weekday": "string",     // "MONDAY" to "SUNDAY"
            "startHour": "string",   // "HH:mm" format (24-hour)
            "endHour": "string"      // "HH:mm" format (24-hour)
        }
    ],
    "grade": "string",        // education grade level
    "visibility": "boolean",   // true for public, false for private
    "maxStudent": "number",     // minimum 1
    "startTime": "string",    // ISO-8601 format, must be in the future
    "endTime": "string"       // ISO-8601 format, must be in the future and after startTime
}
```
- **Response (200 OK)**: Created post object
- **Error Responses**:
  - `403 Forbidden`: If user is not a tutor
  - `400 Bad Request`: If maxStudent is less than 1
  - `400 Bad Request`: If end time is before start time
  - `400 Bad Request`: If start time or end time is in the past
  - `400 Bad Request`: If schedule end hour is before start hour
  - `400 Bad Request`: If schedule overlaps with tutor's existing posts

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
        "schedules": [
            {
                "weekday": "string",     // "MONDAY" to "SUNDAY"
                "startHour": "string",   // "HH:mm" format (24-hour)
                "endHour": "string"      // "HH:mm" format (24-hour)
            }
        ],
        "grade": "string",
        "createdAt": "string",
        "visibility": "boolean",
        "approvedStudent": "number",  // count of confirmed bookings
        "maxStudent": "number",       // maximum number of students allowed
        "startTime": "string",       // ISO-8601 format
        "endTime": "string"          // ISO-8601 format
    }
]
```

### Get Posts by Tutor
- **Route**: `GET /api/posts/tutor/{tutorId}`
- **Access**: Public
- **Description**: Get all posts by a specific tutor
- **Response (200 OK)**: Array of post objects

### Get Post by ID
- **Route**: `GET /api/posts/{postId}`
- **Access**: Public
- **Description**: Get a specific post by its ID
- **Response (200 OK)**:
```json
{
    "id": "string",
    "userId": "string",
    "title": "string",
    "description": "string",
    "subject": "string",
    "location": "string",
    "schedules": [
        {
            "weekday": "string",     // "MONDAY" to "SUNDAY"
            "startHour": "string",   // "HH:mm" format (24-hour)
            "endHour": "string"      // "HH:mm" format (24-hour)
        }
    ],
    "grade": "string",
    "createdAt": "string",
    "visibility": "boolean",
    "approvedStudent": "number",
    "maxStudent": "number"
}
```
- **Error Responses**:
  - `404 Not Found`: If post doesn't exist

### Update Post
- **Route**: `PUT /api/posts/{postId}`
- **Access**: Authenticated tutors (post owner only)
- **Description**: Update an existing tutoring post
- **Headers**: 
  - `Authorization: Bearer <jwt_token>`
- **Request Body**:
```json
{
    "title": "string",         // optional, 5-100 characters
    "description": "string",   // optional, max 1000 characters
    "subject": "string",       // optional
    "location": "string",      // optional
    "schedules": [             // optional, list of weekly schedules
        {
            "weekday": "string",     // "MONDAY" to "SUNDAY"
            "startHour": "string",   // "HH:mm" format (24-hour)
            "endHour": "string"      // "HH:mm" format (24-hour)
        }
    ],
    "grade": "string",         // optional, education grade level
    "visibility": "boolean",   // optional, true for public, false for private
    "maxStudent": "number",    // optional, minimum 1
    "startTime": "string",     // optional, ISO-8601 format, must be in the future
    "endTime": "string"        // optional, ISO-8601 format, must be in the future and after startTime
}
```
- **Response (200 OK)**: Updated post object
- **Error Responses**:
  - `403 Forbidden`: If user is not the owner of the post
  - `404 Not Found`: If post doesn't exist
  - `400 Bad Request`: If maxStudent is less than 1
  - `400 Bad Request`: If end time is before start time
  - `400 Bad Request`: If start time or end time is in the past
  - `400 Bad Request`: If schedule end hour is before start hour
  - `400 Bad Request`: If schedule overlaps with tutor's existing posts

## Bookings Endpoints

### Error Response Format
All booking-related errors will return a response in the following format:
```json
{
    "timestamp": "string",    // ISO-8601 format
    "status": "error",
    "code": "string",        // Error code for programmatic handling
    "message": "string"      // Human-readable error message
}
```

### Error Codes
The following error codes may be returned by booking endpoints:
- `NOT_STUDENT`: When a non-student tries to create/delete a booking
- `POST_NOT_FOUND`: When the requested post doesn't exist
- `POST_NOT_AVAILABLE`: When the post is no longer visible/available
- `POST_FULL`: When the post has reached its maximum students
- `POST_ENDED`: When the post's end date has passed
- `SCHEDULE_OVERLAP`: When the schedule conflicts with existing bookings
- `BOOKING_NOT_FOUND`: When the requested booking doesn't exist
- `NOT_TUTOR`: When a non-tutor tries to update booking status
- `NOT_BOOKING_OWNER`: When trying to modify someone else's booking
- `NOT_PENDING_STATUS`: When trying to delete a non-pending booking

### Create Booking
- **Route**: `POST /api/bookings`
- **Access**: Authenticated students only
- **Description**: Create a new booking for a post (automatically assigns the first available schedule)
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
    "schedule": {
        "weekday": "string",     // "MONDAY" to "SUNDAY"
        "startHour": "string",   // "HH:mm" format (24-hour)
        "endHour": "string"      // "HH:mm" format (24-hour)
    },
    "status": "PENDING",
    "createdAt": "string"
}
```
- **Error Responses**:
  - `400 Bad Request`:
    - Code: `NOT_STUDENT` - If user is not a student
    - Code: `POST_NOT_FOUND` - If post doesn't exist
    - Code: `POST_NOT_AVAILABLE` - If post is no longer available
    - Code: `POST_FULL` - If post has reached maximum students
    - Code: `POST_ENDED` - If post has already ended
    - Code: `SCHEDULE_OVERLAP` - If schedule conflicts with existing bookings

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
            "schedule": {
                "weekday": "string",     // "MONDAY" to "SUNDAY"
                "startHour": "string",   // "HH:mm" format (24-hour)
                "endHour": "string"      // "HH:mm" format (24-hour)
            },
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
  - `400 Bad Request`:
    - Code: `NOT_TUTOR` - If user is not the tutor of this booking
    - Code: `BOOKING_NOT_FOUND` - If booking doesn't exist

### Delete Booking
- **Route**: `DELETE /api/bookings/{bookingId}`
- **Access**: Authenticated students only
- **Description**: Delete a pending booking (only available for students to cancel their unconfirmed bookings)
- **Headers**: 
  - `Authorization: Bearer <jwt_token>`
- **Response (200 OK)**: Empty response
- **Error Responses**:
  - `400 Bad Request`:
    - Code: `NOT_STUDENT` - If user is not a student
    - Code: `NOT_BOOKING_OWNER` - If user is not the student who created the booking
    - Code: `NOT_PENDING_STATUS` - If booking is not in PENDING status
    - Code: `BOOKING_NOT_FOUND` - If booking doesn't exist

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
        "postTitle": "string",   // Title of the related post
        "student": {
            "id": "string",
            "username": "string",
            "fullname": "string",
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
    "postTitle": "string",   // Title of the related post
    "student": {
        "id": "string",
        "username": "string",
        "fullname": "string",
        "avatar": "string"
    }
}
```
- **Error Responses**:
  - `403 Forbidden`: If user is not associated with this booking
  - `404 Not Found`: If review or booking doesn't exist

## Bookmarks Endpoints

### Create Bookmark
- **Route**: `POST /api/bookmarks`
- **Access**: Authenticated users
- **Description**: Bookmark a post for later reference
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
    "userId": "string",
    "postId": "string",
    "createdAt": "string"  // ISO-8601 format
}
```
- **Error Responses**:
  - `400 Bad Request`: If post is already bookmarked
  - `404 Not Found`: If post doesn't exist

### Get User's Bookmarks
- **Route**: `GET /api/bookmarks`
- **Access**: Authenticated users
- **Description**: Get all bookmarks for the current user
- **Headers**: 
  - `Authorization: Bearer <jwt_token>`
- **Response (200 OK)**:
```json
[
    {
        "id": "string",
        "userId": "string",
        "postId": "string",
        "createdAt": "string",  // ISO-8601 format
        "post": {
            // Full post object with all its details
            "id": "string",
            "userId": "string",
            "title": "string",
            "description": "string",
            "subject": "string",
            "location": "string",
            "schedules": [
                {
                    "weekday": "string",
                    "startHour": "string",
                    "endHour": "string"
                }
            ],
            "grade": "string",
            "createdAt": "string",
            "visibility": "boolean",
            "approvedStudent": "number",
            "maxStudent": "number",
            "startTime": "string",
            "endTime": "string"
        }
    }
]
```

### Delete Bookmark
- **Route**: `DELETE /api/bookmarks/{postId}`
- **Access**: Authenticated users
- **Description**: Remove a bookmark
- **Headers**: 
  - `Authorization: Bearer <jwt_token>`
- **Response (200 OK)**: Empty response

## Admin Endpoints

### Get Users (with optional filtering)
- **Route**: `GET /api/admin/users`
- **Access**: Authenticated admin users only
- **Description**: Get a list of all users in the system, with optional role filtering
- **Headers**: 
  - `Authorization: Bearer <jwt_token>`
- **Query Parameters**:
  - `role`: Optional, filter users by role ("STUDENT", "TUTOR", or "ADMIN")
- **Response (200 OK)**:
```json
[
    {
        "id": "string",
        "username": "string",
        "email": "string",
        "role": "string",
        "fullname": "string",
        "phone": "string",
        "address": "string",
        "avatar": "string",
        "bio": "string",
        "createdAt": "string"
    }
]
```
- **Error Responses**:
  - `403 Forbidden`: If user is not an admin

### Get User by ID (Admin)
- **Route**: `GET /api/admin/users/{userId}`
- **Access**: Authenticated admin users only
- **Description**: Get a specific user by ID with admin privileges
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
    "bio": "string",
    "createdAt": "string"  // ISO-8601 format
}
```
- **Error Responses**:
  - `403 Forbidden`: If user is not an admin
  - `404 Not Found`: If user with the specified ID doesn't exist

### Delete User
- **Route**: `DELETE /api/admin/users/{userId}`
- **Access**: Authenticated admin users only
- **Description**: Delete a user from the system
- **Headers**: 
  - `Authorization: Bearer <jwt_token>`
- **Response (200 OK)**: Empty response
- **Error Responses**:
  - `403 Forbidden`: If user is not an admin

### Get All Posts (Admin)
- **Route**: `GET /api/admin/posts`
- **Access**: Authenticated admin users only
- **Description**: Get all posts with admin privileges
- **Headers**: 
  - `Authorization: Bearer <jwt_token>`
- **Response (200 OK)**: Array of post objects
- **Error Responses**:
  - `403 Forbidden`: If user is not an admin

### Update Post (Admin)
- **Route**: `PUT /api/admin/posts/{postId}`
- **Access**: Authenticated admin users only
- **Description**: Update any post with admin privileges (no ownership check)
- **Headers**: 
  - `Authorization: Bearer <jwt_token>`
- **Request Body**:
```json
{
    "title": "string",         // optional, 5-100 characters
    "description": "string",   // optional, max 1000 characters
    "subject": "string",       // optional
    "location": "string",      // optional
    "schedules": [             // optional, list of weekly schedules
        {
            "weekday": "string",     // "MONDAY" to "SUNDAY"
            "startHour": "string",   // "HH:mm" format (24-hour)
            "endHour": "string"      // "HH:mm" format (24-hour)
        }
    ],
    "grade": "string",         // optional, education grade level
    "visibility": "boolean",   // optional, true for public, false for private
    "maxStudent": "number"     // optional, minimum 1
}
```
- **Response (200 OK)**: Updated post object
- **Error Responses**:
  - `403 Forbidden`: If user is not an admin
  - `404 Not Found`: If post doesn't exist

### Delete Post (Admin)
- **Route**: `DELETE /api/admin/posts/{postId}`
- **Access**: Authenticated admin users only
- **Description**: Delete any post with admin privileges
- **Headers**: 
  - `Authorization: Bearer <jwt_token>`
- **Response (200 OK)**: Empty response
- **Error Responses**:
  - `403 Forbidden`: If user is not an admin

### Get Admin Dashboard Statistics
- **Route**: `GET /api/admin/stats`
- **Access**: Authenticated admin users only
- **Description**: Get dashboard statistics for admin
- **Headers**: 
  - `Authorization: Bearer <jwt_token>`
- **Response (200 OK)**:
```json
{
    "tutorCount": "number",
    "studentCount": "number",
    "totalPosts": "number",
    "activePosts": "number"
}
```
- **Error Responses**:
  - `403 Forbidden`: If user is not an admin

### Get User Bookings (Admin)
- **Route**: `GET /api/admin/bookings`
- **Access**: Authenticated admin users only
- **Description**: Get all bookings for a specific user (as either student or tutor)
- **Headers**: 
  - `Authorization: Bearer <jwt_token>`
- **Query Parameters**:
  - `userId`: Required, the ID of the user whose bookings to retrieve
- **Response (200 OK)**:
```json
[
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
]
```
- **Error Responses**:
  - `403 Forbidden`: If user is not an admin
  - `404 Not Found`: If user with the specified ID doesn't exist

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