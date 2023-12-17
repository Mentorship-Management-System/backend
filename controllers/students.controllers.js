const studentModel = require('../models/student.model');

const userController = {
    loginUser: (req, res) => {
        const { tezu_email, password } = req.body;

        studentModel.authenticateStudent(tezu_email, password, (err, result) => {
            if (err) {
                console.error('Error authenticating student:', err);
                res.status(500).json({ error: 'Internal Server Error' });
                return;
            }

            if (!result) {
                res.status(401).json({ error: 'Invalid email or password' });
            } else {
                res.status(200).json({ success: true, student: result });
            }
        });
    },
    getAllStudents: (req, res) => {
        studentModel.getAllStudents((err, results) => {
            if (err) {
                console.error('Error fetching all students:', err);
                res.status(500).json({ error: 'Internal Server Error' });
                return;
            }
            res.status(200).json(results);
        });
    },
    getStudentById: (req, res) => {
        const userId = req.params.rollno;
        studentModel.getStudentByRollNo(userId, (err, results) => {
            if (err) {
                console.error('Error fetching student by ID:', err);
                res.status(500).json({ error: 'Internal Server Error' });
                return;
            }
            if (results.length === 0) {
                res.status(404).json({ error: 'Student not found' });
            } else {
                res.status(200).json(results[0]);
            }
        });
    },
    addStudent: (req, res) => {
        const newUser = req.body;
        studentModel.addStudent(newUser, (err, results) => {
            if (err) {
                console.error('Error adding student:', err);
                res.status(500).json({ error: 'Internal Server Error' });
                return;
            }
            res.status(201).json({ id: results.insertId, message: 'Student added successfully' });
        });
    },
    updateStudent: (req, res) => {
        const userId = req.params.rollno;
        const updatedUser = req.body;
        studentModel.updateStudent(userId, updatedUser, (err) => {
            if (err) {
                console.error('Error updating student:', err);
                res.status(500).json({ error: 'Internal Server Error' });
                return;
            }
            res.status(200).json({ message: 'Student updated successfully' });
        });
    },
    deleteStudent: (req, res) => {
        const userId = req.params.rollno;
        studentModel.deleteStudent(userId, (err) => {
            if (err) {
                console.error('Error deleting student:', err);
                res.status(500).json({ error: 'Internal Server Error' });
                return;
            }
            res.status(200).json({ message: 'Student deleted successfully' });
        });
    },
    insertStudents: (req, res) => {
        const students = [
            {
                fname: "Dheeraj",
                lname: "Gogoi",
                department: "Computer Science and Engineering",
                programme: "Bachelor of Technology",
                enrollment_no: "CSB20028",
                phone: "7099485845",
                personal_email: "dheerajgogoi2@gmail.com",
                tezu_email: "csb20028@tezu.ac.in",
                date_of_birth: "2002-01-15", // Assuming a birth year of 2002
                password: "CSB20028",
            },
            {
                fname: "John",
                lname: "Doe",
                department: "Computer Science and Engineering",
                programme: "Bachelor of Technology",
                enrollment_no: "CSB20029",
                phone: "1234567890",
                personal_email: "john.doe@example.com",
                tezu_email: "eeb12345@tezu.ac.in",
                date_of_birth: "2001-05-20", // Assuming a birth year of 2001
                password: "CSB20029",
            },
            {
                fname: "Alice",
                lname: "Smith",
                department: "Computer Science and Engineering",
                programme: "Bachelor of Technology",
                enrollment_no: "CSB20030",
                phone: "9876543210",
                personal_email: "alice.smith@example.com",
                tezu_email: "meb67890@tezu.ac.in",
                date_of_birth: "2000-11-10", // Assuming a birth year of 2000
                password: "CSB20030",
            },
            {
                fname: "Bob",
                lname: "Johnson",
                department: "Computer Science and Engineering",
                programme: "Bachelor of Technology",
                enrollment_no: "CSB20031",
                phone: "5551234567",
                personal_email: "bob.johnson@example.com",
                tezu_email: "ceb13579@tezu.ac.in",
                date_of_birth: "2003-03-25", // Assuming a birth year of 2003
                password: "CSB20031",
            },
            {
                fname: "Eva",
                lname: "Williams",
                department: "Computer Science and Engineering",
                programme: "Master of Science",
                enrollment_no: "CSB20032",
                phone: "1239874560",
                personal_email: "eva.williams@example.com",
                tezu_email: "msc20032@tezu.ac.in",
                date_of_birth: "2002-07-12", // Assuming a birth year of 2002
                password: "CSB20032",
            },
            {
                fname: "Michael",
                lname: "Brown",
                department: "Computer Science and Engineering",
                programme: "Bachelor of Technology",
                enrollment_no: "CSB20033",
                phone: "7894561230",
                personal_email: "michael.brown@example.com",
                tezu_email: "csb20033@tezu.ac.in",
                date_of_birth: "2001-11-30", // Assuming a birth year of 2001
                password: "CSB20033",
            },
            {
                fname: "Emma",
                lname: "Anderson",
                department: "Computer Science and Engineering",
                programme: "Bachelor of Technology",
                enrollment_no: "CSB20034",
                phone: "4567890123",
                personal_email: "emma.anderson@example.com",
                tezu_email: "mt20034@tezu.ac.in",
                date_of_birth: "2000-04-18", // Assuming a birth year of 2000
                password: "CSB20034",
            },
            {
                fname: "Ryan",
                lname: "Johnson",
                department: "Computer Science and Engineering",
                programme: "Bachelor of Technology",
                enrollment_no: "CSB20035",
                phone: "9870123456",
                personal_email: "ryan.johnson@example.com",
                tezu_email: "bsc20035@tezu.ac.in",
                date_of_birth: "2003-08-08", // Assuming a birth year of 2003
                password: "CSB20035",
            },
            {
                fname: "Sophia",
                lname: "Miller",
                department: "Computer Science and Engineering",
                programme: "Bachelor of Technology",
                enrollment_no: "CSB20036",
                phone: "6543210987",
                personal_email: "sophia.miller@example.com",
                tezu_email: "mt20036@tezu.ac.in",
                date_of_birth: "2002-12-05", // Assuming a birth year of 2002
                password: "CSB20036",
            },
            {
                fname: "Oliver",
                lname: "Davis",
                department: "Computer Science and Engineering",
                programme: "Bachelor of Technology",
                enrollment_no: "CSB20037",
                phone: "3210987654",
                personal_email: "oliver.davis@example.com",
                tezu_email: "csb20037@tezu.ac.in",
                date_of_birth: "2001-02-22", // Assuming a birth year of 2001
                password: "CSB20037",
            },
        ];

        studentModel.insertStudents(students, (err, result) => {
            if (err) {
                console.error('Error inserting students:', err);
                res.status(500).json({ error: 'Internal Server Error' });
            } else {
                res.status(201).json({ message: 'Students inserted successfully' });
            }
        });
    },
};

module.exports = userController;
