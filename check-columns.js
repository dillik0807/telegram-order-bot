const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./orders.db', (err) => {
  if (err) {
    console.error('Error:', err);
    process.exit(1);
  }
  
  db.all("PRAGMA table_info(orders)", (err, rows) => {
    if (err) {
      console.error('Error:', err);
      process.exit(1);
    }
    
    console.log('Columns in orders table:');
    rows.forEach(row => {
      console.log(`  - ${row.name} (${row.type})`);
    });
    
    const requiredColumns = ['telegram_message_id', 'whatsapp_message_id', 'telegram_group_id'];
    const foundColumns = rows.filter(row => requiredColumns.includes(row.name));
    
    console.log(`\nFound ${foundColumns.length}/3 required columns`);
    
    if (foundColumns.length < 3) {
      console.log('\nAdding missing columns...');
      
      const updates = [];
      if (!rows.find(r => r.name === 'telegram_message_id')) {
        updates.push('ALTER TABLE orders ADD COLUMN telegram_message_id TEXT');
      }
      if (!rows.find(r => r.name === 'whatsapp_message_id')) {
        updates.push('ALTER TABLE orders ADD COLUMN whatsapp_message_id TEXT');
      }
      if (!rows.find(r => r.name === 'telegram_group_id')) {
        updates.push('ALTER TABLE orders ADD COLUMN telegram_group_id TEXT');
      }
      
      let completed = 0;
      updates.forEach((sql, index) => {
        db.run(sql, (err) => {
          if (err) {
            console.error(`Error adding column ${index + 1}:`, err.message);
          } else {
            console.log(`✅ Column ${index + 1} added`);
          }
          
          completed++;
          if (completed === updates.length) {
            console.log('\n✅ Migration complete!');
            db.close();
            process.exit(0);
          }
        });
      });
    } else {
      console.log('\n✅ All columns already exist!');
      db.close();
      process.exit(0);
    }
  });
});
