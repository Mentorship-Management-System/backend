const db = require('../db');
const jwt = require('jsonwebtoken');
const { secretKey } = require('../config');

const studentModel = {
    getAllStudents: (callback) => {
        db.query('SELECT * FROM students', callback);
    },
    getStudentByRollNo: (rollno, callback) => {
        db.query('SELECT * FROM students WHERE enrollment_no = ?', [rollno], callback);
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
        db.query('SELECT * FROM students WHERE tezu_email = ? AND password = ?', [tezu_email, password], (err, results) => {
            if (err) {
                return callback(err, null);
            }

            if (results.length === 0) {
                return callback(null, null); // User not found
            }

            const student = results[0];
            const token = jwt.sign({ id: student.enrollment_no, email: student.email }, secretKey, { expiresIn: '6h' });

            callback(null, { student, token });
        });
    },
    insertStudents: (students, callback) => {
        const values = students.map(student => [student.fname, student.lname, student.department, student.programme, student.enrollment_no, student.phone, student.personal_email, student.tezu_email, student.password, student.date_of_birth]);
        const query = 'INSERT INTO students (fname, lname, department, programme, enrollment_no, phone, personal_email, tezu_email, password, date_of_birth) VALUES ?';

        db.query(query, [values], callback);
    },
};

module.exports = studentModel;
