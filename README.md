# TutorHub - Tutoring Platform Frontend

![Main Page Preview](images/main.png)

A modern React application for connecting tutors and students. This platform allows tutors to create and manage tutoring posts, while students can browse available tutors, book sessions, and leave reviews.

## Features

- **User Authentication**: Secure login and registration for students, tutors, and admins
- **Role-Based Access Control**: Different features for students, tutors, and administrators
- **Tutoring Posts**: Tutors can create, edit, and manage their tutoring offerings
- **Booking System**: Students can book tutoring sessions with available tutors
- **Review System**: Students can leave reviews for completed sessions
- **User Profiles**: Customizable profiles for both tutors and students
- **Admin Dashboard**: Comprehensive admin tools for platform management

## Tech Stack

- **Frontend Framework**: React 19 with TypeScript
- **Routing**: React Router v7
- **Styling**: TailwindCSS v4
- **HTTP Client**: Axios
- **Icons**: Font Awesome
- **Date Handling**: date-fns
- **Build Tool**: Vite
- **Linting**: ESLint

## Getting Started

### Prerequisites

- Node.js (v18 or higher recommended)
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/tutorhub-fe.git
   cd tutor-fe
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Create a `.env` file in the root directory with the following variables:
   ```
   VITE_API_URL=http://localhost:8080
   ```

4. Start the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. Open your browser and navigate to `http://localhost:5173`

## Available Scripts

- `npm run dev` - Start the development server
- `npm run build` - Build the production-ready application
- `npm run lint` - Run ESLint to check code quality
- `npm run preview` - Preview the production build locally

## Project Structure

```
src/
├── assets/         # Static assets like images
├── components/     # Reusable UI components
│   ├── auth/       # Authentication related components
│   ├── layout/     # Layout components (Navbar, Footer, etc.)
│   ├── review/     # Review related components
│   └── user/       # User related components
├── contexts/       # React context providers
├── pages/          # Application pages/routes
│   ├── admin/      # Admin pages
│   ├── auth/       # Authentication pages
│   ├── bookings/   # Booking management pages
│   └── posts/      # Post management pages
├── services/       # API services and utilities
├── App.tsx         # Main application component with routing
└── main.tsx        # Application entry point
```

## API Documentation

The backend API documentation is available in the `api-docs.md` file, which details all available endpoints for authentication, posts, bookings, reviews, and admin operations.

## License

[MIT License](LICENSE)

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request
