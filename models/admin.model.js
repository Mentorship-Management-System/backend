const db = require('../db');
const jwt = require('jsonwebtoken');
const { secretKey } = require('../config');
const crypto = require('crypto');

const adminModel = {
    authenticateAdmin: (email, password, callback) => {
        const hashedPassword = crypto.createHash('md5').update(password).digest('hex');
        db.query(`
            SELECT a.*, c.type
            FROM admins a
            INNER JOIN credentials c ON a.email = c.email
            WHERE c.email = ? AND c.password = ? AND c.type = 'admin'
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

    getAllAdmins: (callback) => {
        db.query('SELECT * FROM admins', (err, results) => {
            if (err) {
                return callback(err, null);
            }
            callback(null, results);
        });
    },

    updateAdminById: (adminId, adminData, callback) => {
        const query = 'UPDATE admins SET fname = ?, lname = ? WHERE admin_id = ?';
        
        db.query(query, [adminData.fname, adminData.lname, adminId], (err, result) => {
            if (err) {
                return callback(err);
            }
            callback(null, result);
        });
    },

    insertCredentials: (admins, callback) => {
        const values = admins.map(admin => [admin.email, admin.hashedPassword, "admin"]);
        const query = 'INSERT INTO credentials (email, password, type) VALUES ?';

        db.query(query, [values], callback);
    },

    getCounts: (callback) => {
        const query = `
            SELECT 
                (SELECT COUNT(*) FROM mentors) AS mentorCount,
                (SELECT COUNT(*) FROM students) AS studentCount
        `;
        db.query(query, (err, results) => {
            if (err) {
                return callback(err, null);
            }
            callback(null, results[0]);
        });
    },

    resetPassword: (email, hashedPassword, callback) => {
        const query = 'UPDATE credentials SET password = ? WHERE email = ?';
        db.query(query, [hashedPassword, email], (err, results) => {
            if (err) {
                return callback(err);
            }
            callback(null, results.affectedRows > 0);
        });
    },

    getCredByEmail: (email, callback) => {
        const query = 'SELECT * FROM credentials WHERE email = ?';
        db.query(query, [email], (err, results) => {
            if (err) {
                return callback(err);
            }
            // console.log(results);
            callback(null, results[0]);
        });
    },

    updatePassword: (email, hashedPassword, callback) => {
        const query = 'UPDATE credentials SET password = ? WHERE email = ?';
        db.query(query, [hashedPassword, email], (err, results) => {
            if (err) {
                return callback(err);
            }
            callback(null, results.affectedRows > 0);
        });
    },

    deleteAdminsProfile: (adminIds, callback) => {
        db.beginTransaction((err) => {
            if (err) {
                return callback(err, null);
            }
    
            // Convert adminIds to an array if it's a single ID
            if (!Array.isArray(adminIds)) {
                adminIds = [adminIds];
            }
    
            // Delete corresponding records from credentials table
            db.query('DELETE FROM credentials WHERE email IN (SELECT email FROM admins WHERE admin_id IN (?))', [adminIds], (err, result) => {
                if (err) {
                    return db.rollback(() => {
                        callback(err, null);
                    });
                }
    
                // Delete records from students table
                db.query('DELETE FROM admins WHERE admin_id IN (?)', [adminIds], (err, result) => {
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

    createAdmin: (adminData) => {
        return new Promise((resolve, reject) => {
            const { email, fname, lname } = adminData;
            db.query('INSERT INTO admins (email, fname, lname) VALUES (?, ?, ?)', [email, fname, lname], (err, results) => {
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
    
    getAdminById: (adminId, callback) => {
        const query = 'SELECT * FROM admins WHERE admin_id = ?';
        
        db.query(query, [adminId], (err, results) => {
            if (err) {
                return callback(err);
            }
            callback(null, results[0]);
        });
    },
    
    getAdminByEmail: (email) => {
        return new Promise((resolve, reject) => {
            db.query('SELECT * FROM admins WHERE email = ?', [email], (err, results) => {
                if (err) {
                    return reject(err);
                }
                resolve(results[0]);
            });
        });
    },
};

module.exports = adminModel;
