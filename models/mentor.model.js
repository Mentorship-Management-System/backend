const db = require('../db');
const jwt = require('jsonwebtoken');
const { secretKey } = require('../config');

const MentorModel = {
    getAllMentors: (callback) => {
        db.query('SELECT * FROM mentors', callback);
    },

    getMentorById: (mentorIdx, callback) => {
        db.query('SELECT * FROM mentors WHERE mentor_index = ?', [mentorIdx], callback);
    },

    addMentor: (newMentor, callback) => {
        db.query('INSERT INTO mentors SET ?', newMentor, callback);
    },

    updateMentor: (mentorIdx, updatedMentor, callback) => {
        db.query('UPDATE mentors SET ? WHERE mentor_index = ?', [updatedMentor, mentorIdx], callback);
    },

    deleteMentor: (mentorIdx, callback) => {
        db.query('DELETE FROM mentors WHERE mentor_index = ?', [mentorIdx], callback);
    },
    authenticateMentor: (email, password, callback) => {
        console.log(email, password);
        db.query('SELECT * FROM mentors WHERE email = ? AND password = ?', [email, password], (err, results) => {
            if (err) {
                return callback(err, null);
            }

            console.log(results);

            if (results.length === 0) {
                return callback(null, null); // User not found
            }

            const mentor = results[0];
            const token = jwt.sign({ id: mentor.mentor_index, email: mentor.email }, secretKey, { expiresIn: '6h' });

            callback(null, { mentor, token });
        });
    },
    insertMentors: (mentors, callback) => {
        db.query('INSERT INTO mentors (first_name, last_name, email, password, phone, department) VALUES ?', [mentors.map(mentor => [mentor.first_name, mentor.last_name, mentor.email, mentor.password, mentor.phone, mentor.department])], callback);
    },
};

module.exports = MentorModel;
