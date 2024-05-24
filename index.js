const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const multer = require('multer');
const cors = require("cors");
const helmet = require("helmet");
const studentRoutes = require('./routes/students.routes');
const mentorRoutes = require('./routes/mentors.routes');
const adminRoutes = require('./routes/admin.routes');
const chatRoutes = require('./routes/chats.routes');
const meetingRoutes = require('./routes/meeting.routes');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(helmet());
app.use(multer().array());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.raw({ type: 'application/octet-stream' }));
app.use(express.json({ limit: '50mb' })); 
app.enable('trust proxy');
// app.use(bodyParser.json());

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
app.use('/api/admin', adminRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/meeting', meetingRoutes);