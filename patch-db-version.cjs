const fs = require('fs');
let content = fs.readFileSync('src/lib/db.ts', 'utf8');

content = content.replace("const DB_VERSION = 1;", "const DB_VERSION = 2;");

fs.writeFileSync('src/lib/db.ts', content);
