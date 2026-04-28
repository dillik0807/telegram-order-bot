const fs = require('fs');
let lines = fs.readFileSync('bot.js', 'utf8').split('\n');

console.log('Total lines before:', lines.length);

// Find module.exports line
const modIdx = lines.findIndex(l => l.includes('module.exports = { loadWarehousesAndProducts'));
console.log('module.exports at:', modIdx + 1);

// Keep only up to and including module.exports
lines = lines.slice(0, modIdx + 1);

console.log('Total lines after:', lines.length);

fs.writeFileSync('bot.js', lines.join('\n'), 'utf8');
console.log('done');
