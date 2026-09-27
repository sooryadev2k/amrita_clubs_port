const fs = require('fs');
const data = fs.readFileSync('data.json', 'utf8');
const script = '\n// ===== SEED DATA =====\nfunction getSeedClubs() {\n    return ' + data + ';\n}\n';
fs.appendFileSync('app.js', script);
console.log('Appended getSeedClubs');
