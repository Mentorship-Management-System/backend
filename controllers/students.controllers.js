const studentModel = require('../models/student.model');
const mentorModel = require('../models/mentor.model');
const fs = require("fs");
const crypto = require("crypto")

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

const userController = {
    loginUser: (req, res) => {
        const { tezu_email, password } = req.body;
        console.log(req.body);

        studentModel.authenticateStudent(tezu_email, password, (err, result) => {
            if (err) {
                console.error('Error authenticating student:', err);
                res.status(500).json({ error: 'Internal Server Error' });
                return;
            }
            // console.log(result);

            if (!result) {
                res.status(401).json({ error: 'Invalid email or password' });
            } else {
                res.status(200).json({ success: true, result });
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
            const studentsWithMentors = results.map(student => ({
                ...student,
                mentor: {
                    mentor_id: student.mentor_id,
                    mentor_name: student.mentor_name,
                    email: student.mentor_email,
                    phone: student.mentor_phone
                }
            }));
            res.status(200).json({ success: true, students: studentsWithMentors });
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
                const student = results[0];
                const studentWithMentor = {
                    ...student,
                    mentor: {
                        mentor_id: student.mentor_id,
                        name: student.mentor_name,
                        email: student.mentor_email,
                        phone: student.mentor_phone
                    }
                };
                res.status(200).json({ success: true, student: studentWithMentor });
            }
        });
    },
    addStudent: (req, res) => {
        const newStudent = req.body;
        studentModel.addStudent(newStudent, (err, results) => {
            if (err) {
                console.error('Error adding student:', err);
                res.status(500).json({ error: 'Internal Server Error' });
                return;
            }
            studentModel.getStudentByEmail(newStudent.email, (err, addedStudent) => {
                if (err) {
                    console.error('Error fetching added student:', err);
                    res.status(500).json({ error: 'Internal Server Error' });
                    return;
                }

                // Send the added mentor information in the response
                res.status(201).json({ success: true, student: addedStudent, message: 'Student added successfully' });
            });
        });
    },
    updateStudent: (req, res) => {
        const userId = req.params.rollno;
        const updatedUser = req.body;
        studentModel.updateStudent(userId, updatedUser, (err, result) => {
            if (err) {
                console.error('Error updating student:', err);
                res.status(500).json({ error: 'Internal Server Error' });
                return;
            }
            if (result.affectedRows > 0) {
                studentModel.getStudentByRollNo(userId, (err, updatedResults) => {
                    if (err) {
                        console.error('Error fetching updated student:', err);
                        res.status(500).json({ error: 'Internal Server Error' });
                        return;
                    }

                    const updatedStudent = updatedResults[0];
                    const studentWithMentor = {
                        ...updatedStudent,
                        mentor: {
                            mentor_id: updatedStudent.mentor_id,
                            name: updatedStudent.mentor_name,
                            email: updatedStudent.mentor_email,
                            phone: updatedStudent.mentor_phone
                        }
                    };
                    res.status(200).json({ success: true, message: 'Student updated successfully', student: studentWithMentor });
                });
            } else {
                res.status(404).json({ error: 'Student not found or no changes made' });
            }
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
            res.status(200).json({ sucess: true, message: 'Student deleted successfully' });
        });
    },
    searchStudents: (req, res) => {
        const filter = req.body; // Assuming the filter is sent in the request body
        studentModel.searchStudents(filter, (err, results) => {
            if (err) {
                console.error('Error searching students:', err);
                res.status(500).json({ error: 'Internal Server Error' });
                return;
            }
            res.status(200).json({ success: true, students: results });
        });
    },
    getStudentsByMentorIndex: (req, res) => {
        const mentorIndex = req.params.mentorIndex; // Assuming the mentor_index is part of the route params
        mentorModel.getMentorById(mentorIndex, (mentorErr, mentorResult) => {
            if (mentorErr) {
                console.error('Error checking mentor existence:', mentorErr);
                res.status(500).json({ error: 'Internal Server Error' });
                return;
            }

            if (!mentorResult) {
                res.status(404).json({ success: false, message: 'Mentor not found' });
                return;
            }

            studentModel.getStudentsByMentorIndex(mentorIndex, (err, results) => {
                if (err) {
                    console.error('Error fetching students by mentor index:', err);
                    res.status(500).json({ error: 'Internal Server Error' });
                    return;
                }
                res.status(200).json({ success: true, mentor: mentorResult[0], students: results });
            });
        });
    },
    getStudentWithMentorDetails: (req, res) => {
        const enrollmentNo = req.params.enrollmentNo;

        studentModel.getStudentWithMentorDetails(enrollmentNo, (err, result) => {
            if (err) {
                console.error('Error fetching student details with mentor:', err);
                res.status(500).json({ error: 'Internal Server Error' });
                return;
            }

            if (!result) {
                res.status(404).json({ message: 'Student not found' });
            } else {
                res.status(200).json({ success: true, studentWithMentor: result });
            }
        });
    },
    getAvailableMentees: (req, res) => {
        studentModel.getAvailableMentees((err, mentees) => {
            console.log(mentees);
            console.log(err);
            if (err) {
                console.error('Error fetching available mentees:', err);
                res.status(500).json({ error: 'Internal Server Error' });
                return;
            }

            res.status(200).json({ success: true, mentees });
        });
    },
    assignMenteesToMentor: (req, res) => {
        const { mentor_index, mentee_enrollment_nos } = req.body;
    
        // Validate that mentor_index and mentee_enrollment_nos are present
        if (!mentor_index || !mentee_enrollment_nos || !Array.isArray(mentee_enrollment_nos)) {
            return res.status(400).json({ error: 'Invalid request payload' });
        }
    
        // Assign mentees to the mentor
        studentModel.assignMenteesToMentor(mentor_index, mentee_enrollment_nos, (err, result) => {
            if (err) {
                console.error('Error assigning mentees to mentor:', err);
                res.status(500).json({ error: 'Internal Server Error' });
                return;
            }
    

            res.status(200).json({ success: true, message: 'Mentees assigned to mentor successfully', mentees: result });
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

    generate: (req, res) => {
        studentModel.getAllStudents((err, studentsData) => {
            if (err) {
                console.error('Error fetching students:', err);
                res.status(500).json({ error: 'Internal Server Error' });
                return;
            }
    
            studentsData.forEach(student => {
                student.password = generateRandomPassword(8); // Change 8 to desired password length
            });
    
            const csvData = studentsData.map(student => {
                return `${student.student_id},${student.fname},${student.lname},${student.gsuite_id},${student.password}`;
            }).join('\n');
            
            // Write data to a CSV file
            fs.writeFile('./students.csv', csvData, (err) => {
                if (err) {
                    console.error('Error writing to CSV file:', err);
                    return;
                }
                console.log('Student data has been written to students.csv');
            });
    
            studentsData.forEach(student => {
                student.hashedPassword = hashPassword(student.password); // Hash the password
                delete student.password;
            });
    
            studentModel.insertCredentials(studentsData, (err, result) => {
                if (err) {
                    console.error('Error generating student credentials:', err);
                    res.status(500).json({ error: 'Internal Server Error' });
                } else {
                    console.log('Student credentials generated successfully.');
                    res.status(200).json({ success: true, result: studentsData });
                }
            });
        });
    }
    ,

    getStudentsByMentorId: (req, res) => {
        const mentor_id = req.params.mentorId;
        studentModel.getStudentsByMentorId(mentor_id, (err, results) => {
            if (err) {
                console.error('Error fetching students:', err);
                res.status(500).json({ error: 'Internal Server Error' });
                return;
            }
            res.status(200).json({ success: true, students: results });
        });
    },

    saveSemesterDetails: (req, res) => {
        const semesterDetails = req.body;

        if (!Array.isArray(semesterDetails) || semesterDetails.length === 0) {
            return res.status(400).json({ error: 'Payload should be a non-empty array' });
        }

        // Validation check for each object in the array
        for (const detail of semesterDetails) {
            if (!detail.enrollment_no || !detail.semester || !detail.sgpa) {
                return res.status(400).json({ error: 'Each object must have enrollment_no, semester, and sgpa fields' });
            }
        }

        studentModel.saveSemesterDetails(semesterDetails, (err, result) => {
            if (err) {
                console.error('Error saving semester details:', err);
                return res.status(500).json({ error: 'Internal Server Error' });
            }
            res.status(200).json({ success: true, message: 'Semester details saved successfully' });
        });
    },

    getSgpasByEnrollmentNo: (req, res) => {
        const enrollmentNo = req.params.enrollment_no;
    
        studentModel.getSgpasByEnrollmentNo(enrollmentNo)
            .then((sgpas) => {
                res.status(200).json({ success: true, sgpas });
            })
            .catch((err) => {
                console.error('Error fetching SGPA details:', err);
                res.status(500).json({ error: 'Internal Server Error' });
            });
    },

    saveSgpa: async (req, res) => {
        try {
            const sgpas = req.body;
            const enrollmentNo = sgpas[0].enrollment_no; // Assuming all sgpas are for the same enrollment_no
    
            // Fetch current SGPA records
            const currentSgpas = await studentModel.getSgpasByEnrollmentNo(enrollmentNo);
            const sgpaMap = currentSgpas.reduce((acc, sgpa) => {
                acc[sgpa.semester] = sgpa.sgpa;
                return acc;
            }, {});
    
            let updates = [];
            let inserts = [];
            let unchanged = [];
    
            // Compare and determine updates or inserts
            sgpas.forEach(sgpa => {
                if (sgpaMap[sgpa.semester] === undefined) {
                    inserts.push(sgpa);
                } else if (sgpaMap[sgpa.semester] !== sgpa.sgpa) {
                    updates.push(sgpa);
                } else {
                    unchanged.push(sgpa);
                }
            });
    
            if (updates.length === 0 && inserts.length === 0) {
                return res.status(200).json({ message: 'No changes detected to update or insert.' });
            }
    
            if (updates.length > 0) {
                await studentModel.updateSgpas(updates);
            }
    
            if (inserts.length > 0) {
                await studentModel.insertSgpas(inserts);
            }
    
            res.status(200).json({ success: true, updated: updates.length, inserted: inserts.length, unchanged: unchanged.length });
    
        } catch (error) {
            console.error('Error saving SGPA:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    },

    deleteStudentsProfile: (req, res) => {
        const studentIds = req.body.studentIds;
        console.log(studentIds);

        studentModel.deleteStudentsProfile(studentIds, (err, result) => {
            if (err) {
                console.error('Error deleting students:', err);
                res.status(500).json({ error: 'Internal Server Error' });
                return;
            }

            // If deletion is successful, fetch the updated list of all students
            studentModel.getAllStudents((err, students) => {
                if (err) {
                    console.error('Error fetching students:', err);
                    res.status(500).json({ error: 'Internal Server Error' });
                    return;
                }
                res.status(200).json({ success: true, students });
            });
        });
    },

    insertStudentCredentials(req, res) {
        const students = req.body;
        const insertedStudents = [];
        // res.status(201).json({ message: 'Students added successfully', students: students })

        Promise.all(students.map((studentData, index) => {
            return new Promise((resolve, reject) => {
                studentModel.insertStudent(studentData, (err, studentId) => {
                    if (err) {
                        console.error(`Error adding student ${index + 1}:`, err);
                        reject(err);
                    } else {
                        const hashedPassword = hashPassword(studentData.password);
                        studentModel.insertStudentCredentials(studentData.gsuite_id, hashedPassword, (err) => {
                            if (err) {
                                console.error(`Error registering credentials for student ${index + 1}:`, err);
                                reject(err);
                            } else {
                                insertedStudents.push({ studentId, ...studentData });
                                resolve();
                            }
                        });
                    }
                });
            });
        })).then(() => {
            res.status(201).json({ message: 'Students added successfully', students: insertedStudents });
        }).catch((err) => {
            res.status(500).json({ error: 'Internal server error' });
        });
    },

    getStudentCountByEnrollmentYear: async (req, res) => {
        const startYear = parseInt(req.query.startYear, 10) || 2020;
        const mentorId = req.params.mentorId

        studentModel.getStudentCountByYearRange(startYear, mentorId, (err, studentCounts) => {
            if (err) {
                console.error(err);
                res.status(500).json({ message: 'Error fetching student count' });
            } else {
                res.status(200).json({ success: true, count: studentCounts });
            }
        });
    },

    getAllStudentsCountByYear(req, res) {
        const startYear = parseInt(req.query.startYear, 10) || 2020; // Default to 2020 if not provided
    
        studentModel.getAllStudentCountByYearRange(startYear, (err, studentCounts) => {
            if (err) {
                console.error(err);
                res.status(500).json({ message: 'Error fetching student count' });
            } else {
                res.status(200).json({ success: true, count: studentCounts });
            }
        });
    },

    getGenderCountByEnrollmentYear: (req, res) => {
        studentModel.getGenderCountByEnrollmentYear()
            .then((results) => {
                res.status(200).json({ success: true, data: results });
            })
            .catch((err) => {
                console.error('Error fetching gender count by enrollment year:', err);
                res.status(500).json({ error: 'Internal Server Error' });
            });
    }
};

module.exports = userController;
