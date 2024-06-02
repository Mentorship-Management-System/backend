const studentModel = require('../models/student.model');
const mentorModel = require('../models/mentor.model');
const fs = require('fs');
const crypto = require('crypto')

// Function to generate random password
const generateRandomPassword = (length) => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let password = '';
    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        password += characters.charAt(randomIndex);
    }
    return password;
}

const hashPassword = (password) => {
    const hashedPassword = crypto.createHash('md5').update(password).digest('hex');
    return hashedPassword;
}

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
                res.status(200).json({ success: true, result });
            }
        });
    },

    generate: (req, res) => {
        const mentorId = req.params.mentorId;

        const fetchMentors = mentorId 
            ? mentorModel.getMentorById.bind(null, mentorId)
            : mentorModel.getAllMentors;

        fetchMentors((err, mentors) => {
            let mentorsData = [];
            if (err) {
                console.error('Error fetching mentors:', err);
                res.status(500).json({ error: 'Internal Server Error' });
                return;
            }

            console.log(mentors);
            if(mentorId){
                mentorsData = [mentors];
            } else {
                mentorsData = mentors;
            }

            if (!mentors || mentors.length === 0) {
                res.status(404).json({ error: 'Mentor not found' });
                return;
            }

            mentorsData.forEach(mentor => {
                mentor.password = generateRandomPassword(8); // Change 8 to desired password length
            });

            const csvData = mentorsData.map(mentor => {
                return `${mentor.mentor_id},${mentor.fname},${mentor.lname},${mentor.email},${mentor.password}`;
            }).join('\n');

            // Write data to a CSV file
            fs.writeFile('./mentors.csv', csvData, (err) => {
                if (err) {
                    console.error('Error writing to CSV file:', err);
                    res.status(500).json({ error: 'Internal Server Error' });
                    return;
                }
                console.log('Mentor data has been written to mentors.csv');
            });

            mentorsData.forEach(mentor => {
                mentor.hashedPassword = hashPassword(mentor.password); // Hash the password
                delete mentor.password;
            });

            mentorModel.insertCredentials(mentorsData, (err, result) => {
                if (err) {
                    console.error('Error generating mentor credentials:', err);
                    res.status(500).json({ error: 'Internal Server Error' });
                } else {
                    console.log('Mentor credentials generated successfully.');
                    res.status(200).json({ success: true, result: mentorsData });
                }
            });
        });
    },

    getAllMentors: (req, res) => {
        mentorModel.getAllMentors((err, results) => {
            if (err) {
                console.error('Error fetching all mentors:', err);
                res.status(500).json({ error: 'Internal Server Error' });
                return;
            }
            res.status(200).json({ success: true, mentors: results });
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
            if (results && results.length === 0) {
                res.status(404).json({ error: 'Mentor not found' });
            } else {
                console.log(results);
                res.status(200).json({ success: true, mentor: results });
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
            mentorModel.getMentorByEmail(newMentor.email, (err, addedMentor) => {
                if (err) {
                    console.error('Error fetching added mentor:', err);
                    res.status(500).json({ error: 'Internal Server Error' });
                    return;
                }

                // Send the added mentor information in the response
                res.status(201).json({ success: true, mentor: addedMentor, message: 'Mentor added successfully' });
            });
        });
    },

    updateMentor: (req, res) => {
        const mentorId = req.params.mentorId;
        const updatedMentor = req.body;

        mentorModel.updateMentor(mentorId, updatedMentor, (err, result) => {
            if (err) {
                console.error('Error updating mentor:', err);
                res.status(500).json({ error: 'Internal Server Error' });
                return;
            }
            if (result.affectedRows > 0) {
                mentorModel.getMentorById(mentorId, (err, updatedMentor) => {
                    if (err) {
                        console.error('Error fetching updated mentor:', err);
                        res.status(500).json({ error: 'Internal Server Error' });
                        return;
                    }

                    res.status(200).json({ message: 'Mentor updated successfully', mentor: updatedMentor });
                });
            } else {
                res.status(404).json({ error: 'Mentor not found or no changes made' });
            }
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

    allocateMentees: (req, res) => {
        const assignedMentors = [];

        // Step 1: Fetch students without mentors
        studentModel.getStudentsWithNullMentorIndex((err, students) => {
            if (err) {
                console.error('Error fetching students:', err);
                res.status(500).json({ error: 'Internal Server Error' });
                return;
            }

            // Step 2: Fetch all mentors
            mentorModel.getAllAvailableMentors((mentorErr, mentors) => {
                if (mentorErr) {
                    console.error('Error fetching mentors:', mentorErr);
                    res.status(500).json({ error: 'Internal Server Error' });
                    return;
                }

                // Step 3: Calculate target number of students per mentor
                const targetStudentsPerMentor = Math.floor(students.length / mentors.length);

                // Step 4: Randomly assign students to mentors
                const shuffledStudents = _.shuffle(students);
                let currentMentorIndex = 0;
                let studentsAssigned = 0;
                const assignedStudents = new Set(); // Keep track of assigned students

                shuffledStudents.forEach((student) => {
                    // Check if the current mentor has reached the target number of students
                    if (studentsAssigned >= targetStudentsPerMentor) {
                        currentMentorIndex += 1;
                        studentsAssigned = 0;
                    }

                    // Check if the student is already assigned to a mentor
                    if (!assignedStudents.has(student.enrollment_no)) {
                        // Assign the student to the current mentor
                        const newMentorIndex = mentors[currentMentorIndex].mentor_index;
                        studentModel.updateStudentMentorIndex(student.enrollment_no, newMentorIndex, (updateErr) => {
                            if (updateErr) {
                                console.error('Error updating student mentor_index:', updateErr);
                                res.status(500).json({ error: 'Internal Server Error' });
                                return;
                            }
                        });

                        // Mark the student as assigned
                        assignedStudents.add(student.enrollment_no);

                        // Update assigned mentors array
                        const mentorWithMentees = {
                            mentor: mentors[currentMentorIndex],
                            mentees: assignedStudents.has(student.enrollment_no) ? [student] : [],
                        };

                        const existingMentor = assignedMentors.find((m) => m.mentor.mentor_index === newMentorIndex);

                        if (existingMentor) {
                            existingMentor.mentees.push(student);
                        } else {
                            assignedMentors.push(mentorWithMentees);
                        }

                        studentsAssigned += 1;
                    }
                });

                // Respond with the array of mentors and assigned mentees
                res.status(200).json({ success: true, mentorsWithMentees: assignedMentors });
            });
        })
    },

    getAllMentorsWithMentees: (req, res) => {
        mentorModel.getAllMentorsWithMentees((err, mentorsWithMentees) => {
            if (err) {
                console.error('Error fetching mentors with mentees:', err);
                res.status(500).json({ error: 'Internal Server Error' });
                return;
            }

            res.status(200).json({ success: true, data: mentorsWithMentees });
        });
    },

    getMenteesByMentorIndex: (req, res) => {
        const mentorIndex = req.params.mentorIndex;

        mentorModel.getMenteesByMentorIndex(mentorIndex, (err, mentees) => {
            if (err) {
                console.error('Error fetching mentees by mentor index:', err);
                res.status(500).json({ error: 'Internal Server Error' });
                return;
            }

            res.status(200).json({ success: true, mentees });
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

    updateMentorAvailability: (req, res) => {
        const mentor_id = req.params.mentorId;
        const isAvailable = req.body.isAvailable;
        mentorModel.updateMentorAvailability(mentor_id, isAvailable, (err, result) => {
            if (err) {
                console.error('Error inserting mentors:', err);
                res.status(500).json({ error: 'Internal Server Error' });
            } else {
                res.status(201).json({ message: 'Availability updated successfully', mentor: result });
            }
        });
    },

    deleteMentorsProfile: (req, res) => {
        const mentorIds = req.body.mentorIds;
        console.log(mentorIds);

        mentorModel.deleteMentorsProfile(mentorIds, (err, result) => {
            if (err) {
                console.error('Error deleting students:', err);
                res.status(500).json({ error: 'Internal Server Error' });
                return;
            }

            // If deletion is successful, fetch the updated list of all students
            mentorModel.getAllMentors((err, mentors) => {
                if (err) {
                    console.error('Error fetching mentors:', err);
                    res.status(500).json({ error: 'Internal Server Error' });
                    return;
                }
                res.status(200).json({ success: true, mentors });
            });
        });
    }
};

module.exports = mentorController;
