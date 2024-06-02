const xlsx = require('xlsx');
const path = require('path');
const mysql = require('mysql');

// Assuming you have a MySQL connection already set up
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'mentorship_management'
});

// Load the Excel file
const filePath = path.resolve('./Mentor-Mentee-Allocation(2023-Batch).xlsx');
const workbook = xlsx.readFile(filePath);

// Get the first sheet name
const sheetName = workbook.SheetNames[0];

// Get the sheet data
const sheet = workbook.Sheets[sheetName];

// Convert sheet to JSON, without skipping empty cells
const jsonData = xlsx.utils.sheet_to_json(sheet, { defval: '', header: 1 });

// Define the column headers based on your data
const headers = [
    'index',
    'enrollment_no',
    'student',
    'mentor',
    "mentor_phone",
    'gsuite_id',
    "email",
    "phone"
];

// Function to convert a string to CamelCase
const toCamelCase = (str) => {
    return str.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
};

// Function to determine programme and enrollment year based on enrollment_no
const getProgrammeAndYear = (enrollmentNo) => {
    const prefix = enrollmentNo.slice(0, 3);
    const yearSuffix = enrollmentNo.slice(3, 5);
    let programme = '';
    let enrollmentYear = Number(`20${yearSuffix}`);

    switch (prefix) {
        case 'CSE':
            programme = 'Master of Technology (CSE)';
            break;
        case 'CSI':
            programme = 'Master of Technology (IT)';
            break;
        case 'CSB':
            programme = 'Bachelor of Technology';
            break;
        case 'CSM':
            programme = 'Master of Computer Applications';
            break;
        default:
            programme = 'Unknown Programme';
            break;
    }

    return { programme, enrollmentYear };
};

// Map the data to the column headers and format specific values
const mentors = [];
const mappedData = jsonData.slice(1).map(row => {
    let mappedRow = {
        "student": {
            "fname": null,
            "lname": null
        },
        "mentor": {
            "honorifics": null,
            "fname": null,
            "lname": null,
            "phone": null
        }
    };
    headers.forEach((header, index) => {
        let value = row[index] || '';
        if (header === 'student') {
            mappedRow["student"]["fname"] = (toCamelCase(value)).split(" ")[0];
            mappedRow["student"]["lname"] = (toCamelCase(value)).split(" ").slice(1).join(" ");
            
        } else if (header === 'mentor') {
            mappedRow["mentor"]["honorifics"] = (toCamelCase(value)).split(" ")[0];
            mappedRow["mentor"]["fname"] = (toCamelCase(value)).split(" ")[1];
            mappedRow["mentor"]["lname"] = (toCamelCase(value)).split(" ").slice(2).join(" ");
            
        } else {
            if(header === "mentor_phone"){
                mappedRow["mentor"]["phone"] = value;
            } else {
                mappedRow[header] = value;
            }
        }
    });

    // Add programme and enrollment year fields
    const { programme, enrollmentYear } = getProgrammeAndYear(mappedRow['enrollment_no']);
    mappedRow['programme'] = programme;
    mappedRow['enrollment_year'] = enrollmentYear;

    return mappedRow;
});

// Print the mapped data
// console.log(mappedData);

// // Function to insert student data
// const insertStudentData = (student) => {
//     const { fname, lname } = student.student;
//     const { enrollment_no, gsuite_id, email, phone, programme, enrollment_year } = student;
  
//     const query = `
//         INSERT INTO students (fname, lname, enrollment_no, gsuite_id, email, phone, programme, enrollment_year) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
//     `;
  
//     const values = [fname, lname, enrollment_no, gsuite_id, email, phone, programme, enrollment_year];
//     console.log(values);
  
//     connection.query(query, values, (err, results) => {
//         if (err) {
//             console.error('Error inserting student data:', err);
//         } else {
//             console.log('Student data inserted successfully:');
//         }
//     });
// };


const uniqueMentors = {};
jsonData.slice(2).forEach(row => {
    const mentorName = row[headers.indexOf('mentor')];
    console.log(mentorName);
    if (!uniqueMentors[mentorName]) {
        uniqueMentors[mentorName] = {
            honorifics: mentorName.split(" ")[0], // You can set this based on your data
            fname: mentorName.split(" ")[1],// You can set this based on your data
            lname: mentorName.split(" ").slice(2).join(" "), // You can set this based on your data
            phone: row[headers.indexOf('mentor_phone')]
        };
    }
});

const mentorArray = Object.values(uniqueMentors);

console.log(mentorArray);

// Function to insert student data
const insertMentorData = (mentor) => {
    const { honorifics, fname, lname, phone } = mentor;
  
    const query = `
        INSERT INTO mentors (honorifics, fname, lname, phone) VALUES (?, ?, ?, ?)
    `;
  
    const values = [honorifics, fname, lname, phone];
    console.log(values);
  
    connection.query(query, values, (err, results) => {
        if (err) {
            console.error('Error inserting mentor data:', err);
        } else {
            console.log('Student data inserted successfully:');
        }
    });
};
mentorArray.forEach(insertMentorData);

connection.end();