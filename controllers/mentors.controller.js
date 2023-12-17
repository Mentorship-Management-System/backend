const mentorModel = require('../models/mentor.model');

const mentorController = {
    loginMentor: (req, res) => {
        const { email, password } = req.body;
        console.log({ email, password });

        mentorModel.authenticateMentor(email, password, (err, result) => {
            if (err) {
                console.error('Error authenticating student:', err);
                res.status(500).json({ error: 'Internal Server Error' });
                return;
            }

            if (!result) {
                res.status(401).json({ error: 'Invalid email or password' });
            } else {
                res.status(200).json({ success: true, mentor: result });
            }
        });
    },
    getAllMentors: (req, res) => {
        mentorModel.getAllMentors((err, results) => {
            if (err) {
                console.error('Error fetching all mentors:', err);
                res.status(500).json({ error: 'Internal Server Error' });
                return;
            }
            res.status(200).json(results);
        });
    },

    getMentorById: (req, res) => {
        const mentorId = req.params.mentorId;
        mentorModel.getMentorById(mentorId, (err, results) => {
            if (err) {
                console.error('Error fetching mentor by ID:', err);
                res.status(500).json({ error: 'Internal Server Error' });
                return;
            }
            if (results.length === 0) {
                res.status(404).json({ error: 'Mentor not found' });
            } else {
                res.status(200).json(results[0]);
            }
        });
    },

    addMentor: (req, res) => {
        const newMentor = req.body;
        mentorModel.addMentor(newMentor, (err, results) => {
            if (err) {
                console.error('Error adding mentor:', err);
                res.status(500).json({ error: 'Internal Server Error' });
                return;
            }
            res.status(201).json({ id: results.insertId, message: 'Mentor added successfully' });
        });
    },

    updateMentor: (req, res) => {
        const mentorId = req.params.mentorId;
        const updatedMentor = req.body;
        mentorModel.updateMentor(mentorId, updatedMentor, (err) => {
            if (err) {
                console.error('Error updating mentor:', err);
                res.status(500).json({ error: 'Internal Server Error' });
                return;
            }
            res.status(200).json({ message: 'Mentor updated successfully' });
        });
    },

    deleteMentor: (req, res) => {
        const mentorId = req.params.mentorId;
        mentorModel.deleteMentor(mentorId, (err) => {
            if (err) {
                console.error('Error deleting mentor:', err);
                res.status(500).json({ error: 'Internal Server Error' });
                return;
            }
            res.status(200).json({ message: 'Mentor deleted successfully' });
        });
    },
    insertMentors: (req, res) => {
        const mentors = [
            {
                first_name: "Bhogeshwar",
                last_name: "Borah",
                email: "bborah@tezu.ernet.in",
                password: "qwewqe",
                phone: "9182283901",
                department: "Computer Science and Engineering"
            },
            {
                first_name: "John",
                last_name: "Doe",
                email: "johndoe@example.com",
                password: "password123",
                phone: "1234567890",
                department: "Computer Science and Engineering"
            },
            {
                first_name: "Alice",
                last_name: "Smith",
                email: "alice.smith@example.com",
                password: "pass123",
                phone: "9876543210",
                department: "Computer Science and Engineering"
            },
            {
                first_name: "Bob",
                last_name: "Johnson",
                email: "bob.johnson@example.com",
                password: "bobpass",
                phone: "5551234567",
                department: "Computer Science and Engineering"
            },
            {
                first_name: "Eva",
                last_name: "Williams",
                email: "eva.williams@example.com",
                password: "evapass",
                phone: "1239874560",
                department: "Computer Science and Engineering"
            },
            {
                first_name: "Michael",
                last_name: "Brown",
                email: "michael.brown@example.com",
                password: "mikepass",
                phone: "7894561230",
                department: "Computer Science and Engineering"
            },
            {
                first_name: "Emma",
                last_name: "Anderson",
                email: "emma.anderson@example.com",
                password: "emmapass",
                phone: "4567890123",
                department: "Computer Science and Engineering"
            },
            {
                first_name: "Ryan",
                last_name: "Johnson",
                email: "ryan.johnson@example.com",
                password: "ryanpass",
                phone: "9870123456",
                department: "Computer Science and Engineering"
            },
            {
                first_name: "Sophia",
                last_name: "Miller",
                email: "sophia.miller@example.com",
                password: "sophiapass",
                phone: "6543210987",
                department: "Computer Science and Engineering"
            },
            {
                first_name: "Oliver",
                last_name: "Davis",
                email: "oliver.davis@example.com",
                password: "oliverpass",
                phone: "3210987654",
                department: "Computer Science and Engineering"
            }
        ];
        mentorModel.insertMentors(mentors, (err, result) => {
            if (err) {
                console.error('Error inserting mentors:', err);
                res.status(500).json({ error: 'Internal Server Error' });
            } else {
                res.status(201).json({ message: 'Mentors inserted successfully' });
            }
        });
    },
};

module.exports = mentorController;
