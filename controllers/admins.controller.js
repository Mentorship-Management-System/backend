const adminModel = require('../models/admin.model');
const studentModel = require('../models/student.model');
const mentorModel = require('../models/mentor.model');
const fs = require('fs');
const crypto = require('crypto');
const sendPasswordEmail = require('../nodeMailer');

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
            res.status(200).json({ admins: results.reverse() });
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
    },

    deleteAdminsProfile: (req, res) => {
        const adminIds = req.body.adminIds;
        console.log(adminIds);

        adminModel.deleteAdminsProfile(adminIds, (err, result) => {
            if (err) {
                console.error('Error deleting admins:', err);
                res.status(500).json({ error: 'Internal Server Error' });
                return;
            }

            // If deletion is successful, fetch the updated list of all students
            adminModel.getAllAdmins((err, admins) => {
                if (err) {
                    console.error('Error fetching admins:', err);
                    res.status(500).json({ error: 'Internal Server Error' });
                    return;
                }
                res.status(200).json({ success: true, admins });
            });
        });
    },

    frogotPassword: (req, res) => {
        const { email } = req.body;
        let new_password = generateRandomPassword(8);
        const hashedPassword = hashPassword(new_password);

        adminModel.getCredByEmail(email, (err, result) => {
            if(err){
                console.log(err);
                return res.status(500).json({ message: "Internal server error." })
            }
            if(!result || result === undefined){
                return res.status(500).json({ message: "User does not exists with the entered email" })
            }
            adminModel.updatePassword(email, hashedPassword, (err, result) => {
                if (err) {
                    console.error('Error resetting mentor password:', err);
                    res.status(500).json({ error: 'Internal Server Error' });
                } else {
                    let payload = {
                        type: "forgot_password",
                        to: email,
                        password: new_password
                    }
                    sendPasswordEmail(payload)
                        .then(() => {
                            console.log("Sending email.");
                            res.status(200).json({ success: true, message: 'A new password is sent to the entered email address.' })
                        })
                        .catch((error) => {
                            res.status(200).json({ success: true, message: 'Chat acknowledged and replied successfully' });
                            console.error("Error sending email:", error);
                        });
                    ;
                }
            });
        })
    },

    registerAdmin: async (req, res) => {
        const { email, password, fname, lname } = req.body;
    
        try {
            // Check if the email is already registered
            const existingAdmin = await adminModel.getAdminByEmail(email);
            if (existingAdmin) {
                return res.status(400).json({ error: 'Email is already registered' });
            }
    
            // Hash the password
            const hashedPassword = hashPassword(password);
    
            // Create the admin
            const newAdmin = {
                email,
                fname,
                lname
            };
    
            // Insert admin into the database and get the inserted ID
            const adminId = await adminModel.createAdmin(newAdmin);
    
            // Prepare credentials data
            const credentialsData = {
                email,
                password: hashedPassword,
                type: 'admin'
            };
    
            // Insert credentials into the database
            await adminModel.createCredentials(credentialsData);
    
            // Fetch the newly added admin's details
            const addedAdmin = await adminModel.getAdminByEmail(email);
    
            res.status(201).json({ success: true, message: 'Admin registered successfully', admin: addedAdmin });
        } catch (error) {
            console.error('Error registering admin:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }
};

module.exports = adminController;
