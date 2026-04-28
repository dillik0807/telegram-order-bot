const fs = require('fs');
const c = fs.readFileSync('bot.js', 'utf8');
const lines = c.split('\n');
lines.forEach((l, i) => {
  if (l.includes("lines.push('") && l.trimEnd().endsWith('*\r')) {
    console.log(i + 1, JSON.stringify(l));
  }
});
