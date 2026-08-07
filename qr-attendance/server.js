const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());

// --- STUDENT DATABASE ---
// NOTE: These IDs MUST match the IDs in bulk_qr.py, otherwise scanned
// QR codes will show up as "Unknown Student".
const studentDatabase = {
    "MOD-04051-BLCK": JM
};

let attendanceLog = [];

// Load existing data if files exist so records aren't lost on restart
if (fs.existsSync('attendance.json')) {
    const rawData = fs.readFileSync('attendance.json');
    attendanceLog = JSON.parse(rawData);
}

function updateFiles() {
    fs.writeFileSync('attendance.json', JSON.stringify(attendanceLog, null, 2));
    let csvContent = "Student ID,Name,Date and Time,Status\n";
    attendanceLog.forEach(record => {
        csvContent += `"${record.id}","${record.name}","${record.time}","${record.status}"\n`;
    });
    fs.writeFileSync('attendance_report.csv', csvContent);
}

app.post('/scan', (req, res) => {
    const { studentId } = req.body;
    if (!studentId) return res.status(400).json({ message: "No ID detected" });

    const today = new Date().toLocaleDateString("en-US", { timeZone: "Asia/Manila" });

    // 1. Check for duplicates (Machine Gun protection)
    const alreadyScanned = attendanceLog.find(record => {
        if (!record.time) return false;
        const recordDate = new Date(record.time).toLocaleDateString("en-US", { timeZone: "Asia/Manila" });
        return record.id === studentId && recordDate === today;
    });

    if (alreadyScanned) {
        console.log(`[DUPLICATE] ${studentId} blocked.`);
        return res.status(400).json({ success: false, message: "Already scanned today!" });
    }

    // 2. Process new scan
    const studentName = studentDatabase[studentId] || "Unknown Student";
    const entry = { 
        id: studentId, 
        name: studentName, 
        time: new Date().toLocaleString("en-US", { timeZone: "Asia/Manila" }), 
        status: "Present" 
    };

    attendanceLog.push(entry);
    updateFiles();

    console.log(`[SUCCESS] ${studentName} logged at ${entry.time}`);
    res.json({ success: true, message: `Welcome, ${studentName}!` });
});

app.post('/clear', (req, res) => {
    attendanceLog = [];
    updateFiles();
    console.log("🧹 Data Wiped.");
    res.json({ success: true, message: "Records cleared!" });
});

app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`Time Zone: Asia/Manila`);
});
