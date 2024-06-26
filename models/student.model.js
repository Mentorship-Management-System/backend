const db = require('../db');
const jwt = require('jsonwebtoken');
const { secretKey } = require('../config');
const crypto = require("crypto");

const studentModel = {
    getAllStudents: (callback) => {
        const query = `
        SELECT students.*, 
               mentors.mentor_id AS mentor_id, 
               CONCAT(mentors.honorifics, ' ', mentors.fname, ' ', mentors.lname) AS mentor_name, 
               mentors.email AS mentor_email, 
               mentors.phone AS mentor_phone
        FROM students
        LEFT JOIN mentors ON students.mentor_id = mentors.mentor_id
        `;
        db.query(query, callback);
    },
    getStudentByRollNo: (rollno, callback) => {
        const query = `
            SELECT students.*, 
                mentors.mentor_id AS mentor_id, 
                CONCAT(mentors.honorifics, ' ', mentors.fname, ' ', mentors.lname) AS mentor_name, 
                mentors.email AS mentor_email, 
                mentors.phone AS mentor_phone
            FROM students
            LEFT JOIN mentors ON students.mentor_id = mentors.mentor_id
            WHERE students.enrollment_no = ?
        `;
        db.query(query, [rollno], callback);
    },
    getStudentByEmail: (email, callback) => {
        db.query('SELECT * FROM students WHERE email = ?', [email], callback);
    },
    addStudent: (student, callback) => {
        db.query('INSERT INTO students SET ?', student, callback);
    },
    updateStudent: (rollno, student, callback) => {
        db.query('UPDATE students SET ? WHERE enrollment_no = ?', [student, rollno], callback);
    },
    deleteStudent: (rollno, callback) => {
        db.query('DELETE FROM students WHERE enrollment_no = ?', [rollno], callback);
    },
    authenticateStudent: (tezu_email, password, callback) => {
        const hashedPassword = crypto.createHash('md5').update(password).digest('hex');
        db.query(`
            SELECT a.*, c.type
            FROM students a
            INNER JOIN credentials c ON a.gsuite_id = c.email
            WHERE c.email = ? AND c.password = ? AND c.type = 'student'
        `, [tezu_email, hashedPassword], (err, results) => {
            if (err) {
                return callback(err, null);
            }

            if (results.length === 0) {
                return callback(null, null); // User not found
            }

            const student = results[0];
            const token = jwt.sign({ id: student.student_id, email: student.gsuite_id }, secretKey);

            callback(null, { user: student, token });
        });
    },
    searchStudents: (filter, callback) => {
        const filterEntries = Object.entries(filter);
        const whereClause = filterEntries.map(([key, value]) => `${key} = ?`).join(' AND ');
        const query = `SELECT * FROM students WHERE ${whereClause}`;
        const queryParams = filterEntries.map(([key, value]) => value);
        db.query(query, queryParams, callback);
    },
    getStudentsByMentorIndex: (mentorIndex, callback) => {
        const query = `
            SELECT students.*
            FROM students
            JOIN mentor_mentee ON students.enrollment_no = mentor_mentee.mentee_enrollment_no
            WHERE mentor_mentee.mentor_index = ?;
        `;
        db.query(query, [mentorIndex], callback);
    },
    getStudentsWithNullMentorIndex: (callback) => {
        const query = 'SELECT * FROM students WHERE mentor_index IS NULL';
        db.query(query, callback);
    },
    updateStudentMentorIndex: (enrollmentNo, newMentorIndex, callback) => {
        const query = 'UPDATE students SET mentor_index = ? WHERE enrollment_no = ?';
        db.query(query, [newMentorIndex, enrollmentNo], callback);
    },
    getStudentWithMentorDetails: (enrollmentNo, callback) => {
        const query = `
            SELECT
                students.*,
                mentors.*
            FROM students
            LEFT JOIN mentors ON students.mentor_index = mentors.mentor_index
            WHERE students.enrollment_no = ?
        `;
        db.query(query, [enrollmentNo], callback);
    },
    getAvailableMentees: (callback) => {
        const query = `
            SELECT *
            FROM students
            WHERE mentor_index IS NULL;
        `;
        db.query(query, callback);
    },
    assignMenteesToMentor: (mentorIndex, menteeEnrollmentNos, callback) => {
        // Step 1: Update students with the new mentor_index
        const updateStudentsQuery = 'UPDATE students SET mentor_index = ? WHERE enrollment_no IN (?)';
        db.query(updateStudentsQuery, [mentorIndex, menteeEnrollmentNos], (updateStudentsErr) => {
            if (updateStudentsErr) {
                return callback(updateStudentsErr);
            }

            // Step 2: Insert/update rows in mentor_mentee table
            const insertMentorMenteeQuery = 'INSERT INTO mentor_mentee (mentor_index, mentee_enrollment_no) VALUES ? ON DUPLICATE KEY UPDATE mentor_index = VALUES(mentor_index)';
            const insertValues = menteeEnrollmentNos.map((enrollmentNo) => [mentorIndex, enrollmentNo]);

            db.query(insertMentorMenteeQuery, [insertValues], (insertMentorMenteeErr) => {
                if (insertMentorMenteeErr) {
                    return callback(insertMentorMenteeErr);
                }

                // Step 3: Fetch details of assigned mentees
                const getAssignedMenteesQuery = `
                    SELECT students.*
                    FROM students
                    JOIN mentor_mentee ON students.enrollment_no = mentor_mentee.mentee_enrollment_no
                    WHERE mentor_mentee.mentor_index = ?
                `;
                db.query(getAssignedMenteesQuery, [mentorIndex], (getAssignedMenteesErr, assignedMentees) => {
                    if (getAssignedMenteesErr) {
                        return callback(getAssignedMenteesErr);
                    }

                    callback(null, assignedMentees);
                });
            });
        });
    },
    insertStudents: (students, callback) => {
        const values = students.map(student => [student.fname, student.lname, student.email, student.gsuite_id, student.gender, student.enrollment_no, student.phone, student.programme, student.enrollment_year, student.dob]);
        const query = 'INSERT INTO students (fname, lname, email, gsuite_id, gender, enrollment_no, phone, programme, enrollment_year, dob) VALUES ?';

        db.query(query, [values], callback);
    },

    insertCredentials: (students, callback) => {
        const values = students.map(student => [student.gsuite_id, student.hashedPassword, "student"]);
        const query = 'INSERT INTO credentials (email, password, type) VALUES ?';

        db.query(query, [values], callback);
    },
    getRandomStudents: (callback) => {
        db.query('SELECT * FROM students where mentor_id IS NULL ORDER BY RAND()', (err, results) => {
            if (err) {
                return callback(err, null);
            }
            callback(null, results);
        });
    },
    updateMentorIds: (students, callback) => {
        const updateQueries = students.map(student => {
            return new Promise((resolve, reject) => {
                db.query('UPDATE students SET mentor_id = ? WHERE student_id = ?', [student.mentor_id, student.student_id], (err, result) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    resolve();
                });
            });
        });
        Promise.all(updateQueries)
            .then(() => {
                callback(null);
            })
            .catch(err => {
                callback(err);
            });
    },

    getStudentsByMentorId: (mentorId, callback) => {
        db.query('SELECT * FROM students WHERE mentor_id = ?', [mentorId], (err, results) => {
            if (err) {
                return callback(err, null);
            }
            callback(null, results);
        });
    },

    getStudentsByIds: (studentIds, callback) => {
        // Construct the SQL query to fetch students by their IDs
        const query = 'SELECT * FROM students WHERE student_id IN (?)';
        
        // Execute the query with the provided student IDs
        db.query(query, [studentIds], (err, results) => {
            if (err) {
                return callback(err, null);
            }
            callback(null, results);
        });
    },

    saveSemesterDetails: (semesterDetails, callback) => {
        const values = semesterDetails.map(detail => [detail.enrollment_no, detail.semester, detail.sgpa]);
        const query = 'INSERT INTO sgpas (enrollment_no, semester, sgpa) VALUES ?';

        db.query(query, [values], (err, result) => {
            if (err) {
                return callback(err);
            }
            callback(null, result);
        });
    },

    getSgpasByEnrollmentNo: (enrollmentNo, callback) => {
        const query = 'SELECT * FROM sgpas WHERE enrollment_no = ?';
        db.query(query, [enrollmentNo], (err, results) => {
            if (err) {
                return callback(err, null);
            }
            callback(null, results);
        });
    },

    getSgpasByEnrollmentNo: (enrollmentNo) => {
        return new Promise((resolve, reject) => {
            db.query('SELECT * FROM sgpas WHERE enrollment_no = ?', [enrollmentNo], (err, results) => {
                if (err) {
                    return reject(err);
                }
                console.log(results);
                if (results.length === 0) {
                    resolve([]);
                } else {
                    resolve(results);
                }
            });
        });
    },
    
    updateSgpas: (updates) => {
        const updateQueries = updates.map(sgpa => {
            return new Promise((resolve, reject) => {
                db.query(
                    'UPDATE sgpas SET sgpa = ? WHERE enrollment_no = ? AND semester = ?',
                    [sgpa.sgpa, sgpa.enrollment_no, sgpa.semester],
                    (err, results) => {
                        if (err) {
                            return reject(err);
                        }
                        resolve(results);
                    }
                );
            });
        });
    
        return Promise.all(updateQueries);
    },
    
    insertSgpas: (inserts) => {
        const insertQueries = inserts.map(sgpa => {
            return new Promise((resolve, reject) => {
                db.query(
                    'INSERT INTO sgpas (enrollment_no, semester, sgpa) VALUES (?, ?, ?)',
                    [sgpa.enrollment_no, sgpa.semester, sgpa.sgpa],
                    (err, results) => {
                        if (err) {
                            return reject(err);
                        }
                        resolve(results);
                    }
                );
            });
        });
    
        return Promise.all(insertQueries);
    },

    deleteStudentsProfile: (studentIds, callback) => {
        db.beginTransaction((err) => {
            if (err) {
                return callback(err, null);
            }
    
            // Convert studentIds to an array if it's a single ID
            if (!Array.isArray(studentIds)) {
                studentIds = [studentIds];
            }
    
            // Delete corresponding records from credentials table
            db.query('DELETE FROM credentials WHERE email IN (SELECT gsuite_id FROM students WHERE student_id IN (?))', [studentIds], (err, result) => {
                if (err) {
                    return db.rollback(() => {
                        callback(err, null);
                    });
                }
    
                // Delete records from students table
                db.query('DELETE FROM students WHERE student_id IN (?)', [studentIds], (err, result) => {
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

    insertStudent(studentData, callback) {
        db.query('INSERT INTO students (fname, lname, programme, enrollment_year, gsuite_id, email, phone, enrollment_no) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', [studentData.fname, studentData.lname, studentData.programme, studentData.enrollment_year, studentData.gsuite_id, studentData.email, studentData.phone, studentData.enrollment_no], (err, result) => {
            if (err) {
                console.error('Error inserting student data: ' + err);
                callback(err, null);
            } else {
                console.log('Student data inserted successfully');
                callback(null, result.insertId); // Callback with the ID of the inserted student
            }
        });
    },

    insertStudentCredentials(email, password, callback) {
        db.query('INSERT INTO credentials (email, password, type) VALUES (?, ?, ?)', [email, password, "student"], (err, result) => {
            if (err) {
                console.error('Error registering credentials: ' + err);
                callback(err);
            } else {
                console.log('Credentials registered successfully');
                callback(null);
            }
        });
    },

    getStudentsWithoutMentor(callback) {
        db.query('SELECT * FROM students WHERE mentor_id IS NULL', (err, students) => {
            if (err) {
                console.error('Error retrieving students without mentor:', err);
                callback(err, null);
            } else {
                callback(null, students);
            }
        });
    },

    updateStudentMentor(studentId, mentorId, callback) {
        db.query('UPDATE students SET mentor_id = ? WHERE student_id = ?', [mentorId, studentId], (err, result) => {
            if (err) {
                console.error('Error updating student mentor:', err);
                callback(err);
            } else {
                callback(null);
            }
        });
    },

    getStudentCountByYearRange(startYear, mentorId, callback) {
        const query = `
            SELECT enrollment_year, COUNT(*) AS student_count
            FROM students
            WHERE enrollment_year >= ?
            AND mentor_id = ?
            GROUP BY enrollment_year
            ORDER BY enrollment_year ASC;
        `;
        db.query(query, [startYear, mentorId], (error, rows) => {
            if (error) {
                callback(error);
            } else {
                callback(null, rows);
            }
        });
    },

    getAllStudentCountByYearRange(startYear, callback) {
        const query = `
            SELECT enrollment_year, COUNT(*) AS student_count
            FROM students
            WHERE enrollment_year >= ?
            GROUP BY enrollment_year
            ORDER BY enrollment_year ASC;
        `;
        db.query(query, [startYear], (error, rows) => {
            if (error) {
                callback(error);
            } else {
                callback(null, rows);
            }
        });
    },

    getGenderCountByEnrollmentYear: () => {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT 
                    enrollment_year,
                    SUM(CASE WHEN gender = 'Male' THEN 1 ELSE 0 END) AS male_count,
                    SUM(CASE WHEN gender = 'Female' THEN 1 ELSE 0 END) AS female_count
                FROM students
                GROUP BY enrollment_year;
            `;
            
            db.query(query, (err, results) => {
                if (err) {
                    return reject(err);
                }
                resolve(results);
            });
        });
    }
};

module.exports = studentModel;
