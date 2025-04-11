# Blood Donation Management System

A web application for managing blood donors in a university setting. Built with React.js, Node.js, Express, and MongoDB.

## Features

- Secure admin authentication
- Donor management (Add, Remove, Update)
- Search donors by city or blood group
- Track donation history and next available date
- Responsive design with Tailwind CSS

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (v4 or higher)
- npm or yarn package manager

## Setup Instructions

1. Clone the repository
2. Install dependencies:

   ```bash
   # Install frontend dependencies
   npm install

   # Install backend dependencies
   cd server
   npm install
   ```

3. Configure environment variables:

   - Copy `.env.example` to `.env` in the server directory
   - Update the values as needed

4. Start the development servers:

   ```bash
   # Start backend server (from server directory)
   npm run dev

   # Start frontend development server (from root directory)
   npm start
   ```

5. Access the application:
   - Frontend: http://localhost:3000
   - Backend: http://localhost:5000

## Default Admin Credentials

- Username: admin
- Password: admin123

**Important:** Change these credentials in production by updating the `.env` file.
