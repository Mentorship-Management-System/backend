const db = require('../db');
const jwt = require('jsonwebtoken');
const { secretKey } = require('../config');

const MentorModel = {
    getAllMentors: (callback) => {
        db.query('SELECT * FROM mentors', callback);
    },

    getAllAvailableMentors: (callback) => {
        db.query('SELECT * FROM mentors WHERE is_mentor is TRUE', callback);
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

    getMentorById: (mentorIdx, callback) => {
        const query = 'SELECT * FROM mentors WHERE mentor_id = ?';
        db.query(query, [mentorIdx], (err, results) => {
            if (err) {
                callback(err, null);
            } else {
                callback(null, results[0]);
            }
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

    updateMentor: (mentorIdx, updatedMentor, callback) => {
        db.query('UPDATE mentors SET ? WHERE mentor_id = ?', [updatedMentor, mentorIdx], callback);
    },

    deleteMentor: (mentorIdx, callback) => {
        db.query('DELETE FROM mentors WHERE mentor_id = ?', [mentorIdx], callback);
    },
    authenticateMentor: (email, password, callback) => {
        db.query('SELECT * FROM mentors WHERE email = ? AND password = ? AND type = "mentor"', [email, password], (err, results) => {
            if (err) {
                return callback(err, null);
            }

            console.log(results);

            if (results.length === 0) {
                return callback(null, null); // User not found
            }

            const mentor = results[0];
            const token = jwt.sign({ id: mentor.mentor_id, email: mentor.email }, secretKey, { expiresIn: '6h' });

            callback(null, { mentor, token });
        });
    },
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
    }
};

module.exports = MentorModel;
