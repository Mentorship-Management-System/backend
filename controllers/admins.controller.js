const adminModel = require('../models/admin.model');
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

const adminController = {
    loginAdmin: (req, res) => {
        const { email, password } = req.body;
        console.log({ email, password });

        adminModel.authenticateAdmin(email, password, (err, result) => {
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
    getAllAdmins: (req, res) => {
        adminModel.getAllAdmins((err, results) => {
            if (err) {
                console.error('Error fetching admins:', err);
                res.status(500).json({ error: 'Internal Server Error' });
                return;
            }
            res.status(200).json({ admins: results });
        });
    },
    generate: (req, res) => {
        let adminsData = req.body.admins;

        adminsData.forEach(admin => {
            admin.password = generateRandomPassword(8); // Change 8 to desired password length
        });

        const csvData = adminsData.map(admin => {
            return `${admin.admin_id},${admin.fname},${admin.lname},${admin.email},${admin.password}`;
        }).join('\n');
        
        // Write data to a CSV file
        fs.writeFile('./admins.csv', csvData, (err) => {
            if (err) {
                console.error('Error writing to CSV file:', err);
                return;
            }
            console.log('Admin data has been written to admins.csv');
        });

        adminsData.forEach(admin => {
            admin.hashedPassword = hashPassword(admin.password); // Hash the password
            delete admin.password;
        });

        adminModel.insertCredentials(adminsData, (err, result) => {
            if (err) {
                console.error('Error generating admin credentials:', err);
                res.status(500).json({ error: 'Internal Server Error' });
            } else {
                console.log('Admin credentials generated successfully.');
                res.status(200).json({ success: true, result: adminsData });
            }
        });
    },
    allocateMentorsToStudents: (req, res) => {
        mentorModel.getRandomAvailableMentors((err, mentors) => {
            if (err) {
                console.error('Error fetching mentors:', err);
                res.status(500).json({ error: 'Internal Server Error' });
                return;
            }
            // console.log("mentors", mentors);

            studentModel.getRandomStudents((err, students) => {
                if (err) {
                    console.error('Error fetching students:', err);
                    res.status(500).json({ error: 'Internal Server Error' });
                    return;
                }
                // console.log("students", students);

                const studentsPerMentor = Math.floor(students.length / mentors.length);
                let allocatedStudents = [];
                let j = 0;

                students.forEach(student => {
                    student.mentor_id = mentors[j].mentor_id;
                    allocatedStudents.push(student);
                    j++;
                    if (j === mentors.length) {
                        j = 0;
                    }
                });

                // mentors.forEach((mentor, index) => {
                //     const mentorStudents = students.slice(index * studentsPerMentor, (index + 1) * studentsPerMentor);
                //     mentorStudents.forEach(student => {
                //         student.mentor_id = mentor.mentor_id;
                //         allocatedStudents.push(student);
                //     });
                // });

                // Update student records with allocated mentor IDs
                studentModel.updateMentorIds(allocatedStudents, (err) => {
                    if (err) {
                        console.error('Error updating student records:', err);
                        res.status(500).json({ error: 'Internal Server Error' });
                        return;
                    }
                    
                    res.status(200).json({ success: true, allocated_students: allocatedStudents });
                });
            });
        });
    },

    getCounts: (req, res) => {
        adminModel.getCounts((err, counts) => {
            if (err) {
                console.error('Error fetching counts:', err);
                res.status(500).json({ error: 'Internal Server Error' });
                return;
            }
            res.status(200).json({ success: true, counts });
        });
    },

    resetPassword: (req, res) => {
        const { email, newPassword } = req.body;
        const hashedPassword = hashPassword(newPassword);
    
        adminModel.resetPassword(email, hashedPassword, (err, result) => {
            if (err) {
                console.error('Error resetting mentor password:', err);
                res.status(500).json({ error: 'Internal Server Error' });
            } else {
                res.status(200).json({ success: true, message: 'Password reset successfully' });
            }
        });
    }
};

module.exports = adminController;
