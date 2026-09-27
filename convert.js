const fs = require('fs');
const appJs = fs.readFileSync('app.js', 'utf8');

// Extract the getSeedClubs function block
const startIdx = appJs.indexOf('function getSeedClubs() {');
const funcStr = appJs.substring(startIdx);

// Evaluate it to get the array
const script = funcStr + '\nmodule.exports = getSeedClubs();';
fs.writeFileSync('temp.js', script);
const seedClubs = require('./temp');

fs.writeFileSync('data.json', JSON.stringify(seedClubs, null, 2));
console.log('Created data.json with ' + seedClubs.length + ' clubs.');
