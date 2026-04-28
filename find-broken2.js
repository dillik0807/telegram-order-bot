const fs = require('fs');
const c = fs.readFileSync('bot.js', 'utf8');
const lines = c.split('\n');
lines.forEach((l, i) => {
  // Find lines with unclosed string (push with * but no closing )
  if (l.includes("lines.push('") && l.includes('*') && !l.includes("');")) {
    console.log(i + 1, JSON.stringify(l));
  }
});
