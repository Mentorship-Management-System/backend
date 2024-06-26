const db = require('../db');
const jwt = require('jsonwebtoken');
const { secretKey } = require('../config');
const fs = require('fs');
const crypto = require('crypto')

const MentorModel = {
    getAllMentors: (callback) => {
        const query = `
            SELECT 
                mentors.*, 
                IFNULL(GROUP_CONCAT(
                    JSON_OBJECT(
                        'student_id', students.student_id, 
                        'fname', students.fname, 
                        'lname', students.lname
                    )
                    SEPARATOR ','
                ), '[]') AS assigned_mentees
            FROM mentors
            LEFT JOIN students ON mentors.mentor_id = students.mentor_id
            GROUP BY mentors.mentor_id
        `;

        db.query(query, (err, results) => {
            if (err) {
                return callback(err);
            }

            // Parse the JSON objects for assigned mentees
            const parsedResults = results.map(mentor => {
                let assignedMentees = [];
                if (mentor.assigned_mentees && mentor.assigned_mentees !== '[]') {
                    assignedMentees = JSON.parse(`[${mentor.assigned_mentees}]`).filter(mentee => mentee.student_id !== null);
                }
                return {
                    ...mentor,
                    assigned_mentees: assignedMentees
                };
            });

            callback(null, parsedResults);
        });
    },

    getAllAvailableMentors: (callback) => {
        const query = `
            SELECT 
                mentors.*, 
                IFNULL(
                    CONCAT('[', GROUP_CONCAT(
                        JSON_OBJECT(
                            'student_id', students.student_id, 
                            'fname', students.fname, 
                            'lname', students.lname
                        ) 
                        SEPARATOR ','
                    ), ']'), '[]'
                ) AS assigned_mentees
            FROM 
                mentors
            LEFT JOIN 
                students ON mentors.mentor_id = students.mentor_id
            WHERE 
                mentors.isAvailableAsMentor = TRUE
            GROUP BY 
                mentors.mentor_id;
        `;

        db.query(query, (err, results) => {
            if (err) {
                return callback(err);
            }

            // Parse the JSON objects for assigned mentees
            const parsedResults = results.map(mentor => {
                let assignedMentees = [];
                if (mentor.assigned_mentees && mentor.assigned_mentees !== '[]') {
                    assignedMentees = JSON.parse(`[${mentor.assigned_mentees}]`).filter(mentee => mentee.student_id !== null);
                }
                return {
                    ...mentor,
                    assigned_mentees: assignedMentees
                };
            });

            callback(null, parsedResults);
        });
    },

    getAllMentorsWithMentees: (callback) => {
        const query = `
            SELECT
                mentors.*,
                students.*
            FROM mentors
            LEFT JOIN students ON mentors.mentor_id = students.mentor_id
        `;
        db.query(query, callback);
    },

    getMentorById: (mentorId, callback) => {
        const query = 'SELECT * FROM mentors WHERE mentor_id = ?';
        db.query(query, [mentorId], (err, results) => {
            if (err) {
                callback(err, null);
                return;
            }
            console.log("Result", results);
            callback(null, results[0]);
        });
    },

    getMenteesByMentorIndex: (mentorIndex, callback) => {
        const query = `
            SELECT
                students.*
            FROM students
            WHERE students.mentor_id = ?
        `;
        db.query(query, [mentorIndex], callback);
    },

    getMentorByEmail: (email, callback) => {
        db.query('SELECT * FROM mentors WHERE email = ?', [email], callback);
    },

    addMentor: (newMentor, callback) => {
        db.query('INSERT INTO mentors SET ?', newMentor, callback);
    },

    updateMentor: (mentorId, updatedMentor, callback) => {
        db.query('UPDATE mentors SET ? WHERE mentor_id = ?', [updatedMentor, mentorId], callback);
    },

    deleteMentor: (mentorIdx, callback) => {
        db.query('DELETE FROM mentors WHERE mentor_id = ?', [mentorIdx], callback);
    },
    authenticateMentor: (email, password, callback) => {
        const hashedPassword = crypto.createHash('md5').update(password).digest('hex');
        db.query(`
            SELECT a.*, c.type
            FROM mentors a
            INNER JOIN credentials c ON a.email = c.email
            WHERE c.email = ? AND c.password = ? AND c.type = 'mentor'
        `, [email, hashedPassword], (err, results) => {
            if (err) {
                return callback(err, null);
            }

            if (results.length === 0) {
                return callback(null, null); // User not found
            }

            const user = results[0];
            const token = jwt.sign({ id: user.admin_id, email: user.email }, secretKey);

            callback(null, { user, token });
        });
    },
    // authenticateMentor: (email, password, callback) => {
    //     db.query('SELECT * FROM credentials WHERE email = ? AND password = ? AND type = "mentor"', [email, password], (err, results) => {
    //         if (err) {
    //             return callback(err, null);
    //         }

    //         console.log(results);

    //         if (results.length === 0) {
    //             return callback(null, null); // User not found
    //         }

    //         const mentor = results[0];
    //         const token = jwt.sign({ id: mentor.mentor_id, email: mentor.email }, secretKey);

    //         callback(null, { mentor, token });
    //     });
    // },
    insertMentors: (mentors, callback) => {
        db.query('INSERT INTO mentors (first_name, last_name, email, password, phone, department) VALUES ?', [mentors.map(mentor => [mentor.first_name, mentor.last_name, mentor.email, mentor.password, mentor.phone, mentor.department])], callback);
    },
    getRandomAvailableMentors: (callback) => {
        db.query('SELECT * FROM mentors WHERE isAvailableAsMentor = true ORDER BY RAND()', (err, results) => {
            if (err) {
                return callback(err, null);
            }
            callback(null, results);
        });
    },

    updateMentorAvailability: (mentorId, isAvailable, callback) => {
        db.query('UPDATE mentors SET isAvailableAsMentor = ? WHERE mentor_id = ?', [isAvailable, mentorId], (err, result) => {
            if (err) {
                return callback(err);
            }
            if (result.affectedRows === 0) {
                return callback(null, false); // Mentor not found
            }
            // Fetch the updated mentor details
            db.query('SELECT * FROM mentors WHERE mentor_id = ?', [mentorId], (err, mentorResult) => {
                if (err) {
                    return callback(err);
                }
                const updatedMentor = mentorResult[0];
                callback(null, updatedMentor);
            });
        });
    },

    insertCredentials: (mentors, callback) => {
        const values = mentors.map(mentor => [mentor.email, mentor.hashedPassword, "mentor"]);
        const query = 'INSERT INTO credentials (email, password, type) VALUES ?';

        db.query(query, [values], callback);
    },

    deleteMentorsProfile: (mentorIds, callback) => {
        db.beginTransaction((err) => {
            if (err) {
                return callback(err, null);
            }
    
            // Convert mentorIds to an array if it's a single ID
            if (!Array.isArray(mentorIds)) {
                mentorIds = [mentorIds];
            }
    
            // Delete corresponding records from credentials table
            db.query('DELETE FROM credentials WHERE email IN (SELECT email FROM mentors WHERE mentor_id IN (?))', [mentorIds], (err, result) => {
                if (err) {
                    return db.rollback(() => {
                        callback(err, null);
                    });
                }
    
                // Delete records from students table
                db.query('DELETE FROM mentors WHERE mentor_id IN (?)', [mentorIds], (err, result) => {
                    if (err) {
                        return db.rollback(() => {
                            callback(err, null);
                        });
                    }
    
                    db.commit((err) => {
                        if (err) {
                            return db.rollback(() => {
                                callback(err, null);
                            });
                        }
                        callback(null, result);
                    });
                });
            });
        });
    },

    createMentor: (mentorData) => {
        return new Promise((resolve, reject) => {
            const { email, fname, lname, gsuite_id } = mentorData;
            db.query('INSERT INTO mentors (email, fname, lname, gsuite_id) VALUES (?, ?, ?, ?)', [email, fname, lname, gsuite_id], (err, results) => {
                if (err) {
                    return reject(err);
                }
                resolve(results.insertId);
            });
        });
    },
    
    createCredentials: (credentialsData) => {
        return new Promise((resolve, reject) => {
            const { email, password, type } = credentialsData;
            db.query('INSERT INTO credentials (email, password, type) VALUES (?, ?, ?)', [email, password, type], (err, results) => {
                if (err) {
                    return reject(err);
                }
                resolve(results.insertId);
            });
        });
    },
    
    getMentorByEmailRegister: (email) => {
        return new Promise((resolve, reject) => {
            db.query('SELECT * FROM mentors WHERE email = ?', [email], (err, results) => {
                if (err) {
                    return reject(err);
                }
                resolve(results[0]);
            });
        });
    },

    getAvailableMentors(callback) {
        db.query('SELECT * FROM mentors WHERE isAvailableAsMentor = true', (err, mentors) => {
            if (err) {
                console.error('Error retrieving available mentors:', err);
                callback(err, null);
            } else {
                callback(null, mentors);
            }
        });
    }
};

module.exports = MentorModel;
