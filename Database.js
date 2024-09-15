const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');

const db = new sqlite3.Database('database.db'); // قاعدة بيانات دائمة على القرص

// إعداد قاعدة البيانات
const setupDatabase = () => {
  db.serialize(() => {
    db.run("CREATE TABLE IF NOT EXISTS Users (userID TEXT PRIMARY KEY, role TEXT, name TEXT, password TEXT)");

    const stmt = db.prepare("INSERT OR IGNORE INTO Users (userID, role, name, password) VALUES (?, ?, ?, ?)");
    stmt.run("id1", "student", "user1", bcrypt.hashSync("password", 10));
    stmt.run("id2", "student", "user2", bcrypt.hashSync("password2", 10));
    stmt.run("id3", "teacher", "user3", bcrypt.hashSync("password3", 10));
    stmt.run("admin", "admin", "admin", bcrypt.hashSync("admin", 10));
    stmt.finalize();
  });
};

// فتح قاعدة البيانات
const openDatabase = () => {
  db.serialize(() => {
    console.log('Database is ready.');
  });
};

// استدعاء الإعداد وفتح قاعدة البيانات
setupDatabase();
openDatabase();

module.exports = db;
