const fs = require('fs');

// 1. Read the JSON file
const rawData = fs.readFileSync('attendance.json');
const attendance = JSON.parse(rawData);

// 2. Define the Header for the CSV (matches server.js output)
let csvContent = "Student ID,Name,Date and Time,Status\n";

// 3. Loop through the data and add rows
attendance.forEach(record => {
    // We use quotes around the values just in case there are commas in the date
    csvContent += `"${record.id}","${record.name || ''}","${record.time}","${record.status}"\n`;
});

// 4. Save to a .csv file
fs.writeFileSync('attendance_report.csv', csvContent);

console.log("✅ Export Successful! Open 'attendance_report.csv' to see your data.");
