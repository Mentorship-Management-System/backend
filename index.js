const express = require('express');
const bodyParser = require('body-parser');
const studentRoutes = require('./routes/students.routes');
const mentorRoutes = require('./routes/mentors.routes');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(bodyParser.json());

// Connect to the database when the server starts
db.connect((err) => {
    if (err) {
        console.error('Error connecting to the database:', err);
        process.exit(1);
    }

    console.log('Connected to MySQL database');

    // Start Server
    const server = app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });

    // Disconnect from the database when the server is stopped
    process.on('exit', () => {
        db.end((err) => {
            if (err) {
                console.error('Error disconnecting from the database:', err);
            } else {
                console.log('Disconnected from MySQL database');
            }
        });
    });

    process.on('SIGINT', () => {
        server.close(() => {
            process.exit(0);
        });
    });
});

// Routes
app.use('/api/student', studentRoutes);
app.use('/api/mentor', mentorRoutes);