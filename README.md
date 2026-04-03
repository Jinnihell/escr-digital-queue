# ESCR Digital Queue Management System

A modern digital queue management system for educational institutions built with React, Firebase, and Tailwind CSS.

## Features

- **Student Portal**: Get queue tickets, track position, view history
- **Staff Dashboard**: Call next ticket, complete transactions, manage queue
- **Admin Panel**: System settings, reports, transaction management
- **Public Monitor**: Display current serving tickets on screens

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite
- **Styling**: Tailwind CSS v4
- **Backend**: Firebase (Firestore, Authentication)
- **Deployment**: Vercel, GitHub

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## Configuration

1. Create a Firebase project at https://console.firebase.google.com
2. Enable Firestore and Authentication (Email/Password)
3. Copy `.env.example` to `.env` and fill in your config
4. Run `npm run seed` to initialize default data

## License

MIT