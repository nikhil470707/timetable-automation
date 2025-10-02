# Timetable Scheduler

A web-based timetable scheduling system that automatically generates optimal class schedules using constraint programming.

## What it does

This application helps educational institutions create conflict-free timetables by automatically assigning courses to teachers, rooms, and time slots. It handles all the complex scheduling constraints like teacher availability, room capacity, and group preferences.

The system includes a web dashboard where admins can manage data, generate schedules, and publish final timetables for teachers and students to view.

## Features

- **Smart scheduling**: Uses Google OR-Tools to solve scheduling constraints and find optimal solutions
- **User roles**: Different access levels for admins, teachers, and students
- **Data management**: Easy-to-use interface for managing teachers, rooms, courses, groups, and time slots
- **Version control**: Save multiple schedule drafts and lock final versions for publishing
- **Export options**: Download timetables as PDF or CSV files
- **Responsive design**: Works on desktop and mobile devices

## Tech Stack

- **Frontend**: React with Tailwind CSS for the user interface
- **Backend**: Node.js and Express for the API server
- **Database**: MongoDB for storing all data
- **Solver**: Python with Google OR-Tools for schedule optimization

## Setup

You'll need to set up three components: the backend API, the Python solver, and the frontend.

### Requirements

- Node.js (LTS version) and npm
- Python 3.8 or higher
- MongoDB (local installation or MongoDB Atlas)

### Installation

**1. Backend Setup**

```bash
cd server
npm install
```

Create a `.env` file with your MongoDB connection string:
```env
MONGO_URI="your_mongodb_connection_string_here"
```

**2. Python Solver Setup**

```bash
cd solver
python -m venv venv

# Windows
.\venv\Scripts\activate
# macOS/Linux
source venv/bin/activate

pip install ortools pandas python-csv-writer
```

**3. Frontend Setup**

```bash
cd client
npm install
```

## Running the Application

**1. Initialize the database**

```bash
cd server
node migrateData.js
```

This loads sample data and creates default user accounts.

**2. Start the backend**

```bash
npm start
```

The API server runs on http://localhost:5000

**3. Start the frontend**

```bash
cd client
npm run dev
```

The web app runs on http://localhost:5173

## Default Login Accounts

| Username | Password | Role | Access |
|----------|----------|------|---------|
| admin | password | Admin | Full access - manage data, generate schedules, publish timetables |
| T1 | password | Teacher | View published timetables (teacher perspective) |
| G1 | password | Student | View published timetables (group perspective) |

## Project Structure

```
timetable_solver/
├── client/              # React frontend
│   ├── src/
│   │   ├── components/  # UI components and forms
│   │   └── App.jsx      # Main app layout
├── server/              # Node.js backend
│   ├── controllers/     # API logic
│   ├── models/          # Database schemas
│   ├── routes/          # API endpoints
│   └── server.js        # Server entry point
└── solver/              # Python solver
    ├── data/            # CSV data files
    ├── model_builder.py # Constraint definitions
    ├── preprocess.py    # Data preparation
    └── solver.py        # Main solver script
```

## How it works

1. **Data Management**: Admins use the web interface to add teachers, rooms, courses, groups, and time slots
2. **Schedule Generation**: The system exports data to CSV files and runs the Python solver
3. **Optimization**: OR-Tools finds the best schedule that satisfies all constraints
4. **Publishing**: Admins can review, save, and publish the final timetable
5. **Access Control**: Teachers and students can only view published schedules