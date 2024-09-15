require('dotenv').config(); // تحميل المتغيرات من ملف .env
const express = require('express');
const path = require('path');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const db = require('./database'); // استيراد قاعدة البيانات

const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware للتحقق من JWT
const authenticateToken = (req, res, next) => {
  console.log('--- Middleware Execution Start ---');
  console.log('Received request for:', req.originalUrl);
  console.log('Request method:', req.method);
  console.log('Request headers:', req.headers);

  const authHeader = req.headers['authorization'];
  console.log('Authorization Header:', authHeader);

  if (!authHeader) {
    console.log('No authorization header found');
    return res.status(401).json({ message: 'No authorization header found' });
  }

  const token = authHeader.split(' ')[1];
  console.log('Extracted Token:', token);

  if (!token) {
    console.log('No token provided');
    return res.status(401).json({ message: 'No token provided' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      console.log('Token verification failed:', err);
      return res.status(403).json({ message: 'Forbidden: Token is invalid' });
    }

    console.log('Token verified successfully. User:', user);
    req.user = user;

    console.log('User ID:', user.userID);
    console.log('User Role:', user.role);

    next();
    console.log('--- Middleware Execution End ---');
  });
};

// مسارات التسجيل والتعرف
app.get('/register', (req, res) => {
  console.log('Rendering registration page');
  res.render('register');
});

app.post('/register', (req, res) => {
  const { userID, name, password, role } = req.body;
  console.log('Registration data:', { userID, name, role });

  if (!userID || !name || !password || !role) {
    console.log('Missing fields in registration form');
    return res.status(400).json({ message: 'All fields are required' });
  }

  bcrypt.hash(password, 10, (err, hash) => {
    if (err) {
      console.log('Error hashing password:', err);
      return res.status(500).json({ message: 'Error hashing password' });
    }

    db.run("INSERT INTO Users (userID, role, name, password) VALUES (?, ?, ?, ?)", [userID, role, name, hash], (err) => {
      if (err) {
        console.log('Error saving user to database:', err);
        return res.status(500).json({ message: 'Error saving user' });
      }
      console.log('User registered successfully');
      res.redirect('/identify');
    });
  });
});

app.get('/identify', (req, res) => {
  console.log('Rendering identify page');
  res.render('identify');
});

app.post('/identify', (req, res) => {
  const { userID, password } = req.body;
  console.log('Identify attempt:', { userID });

  if (!userID || !password) {
    console.log('Missing fields in identify form');
    return res.status(400).json({ message: 'All fields are required' });
  }

  db.get("SELECT * FROM Users WHERE userID = ?", [userID], (err, row) => {
    if (err) {
      console.log('Error retrieving user from database:', err);
      return res.status(500).json({ message: 'Error retrieving user' });
    }
    if (!row) {
      console.log('User not found');
      return res.status(404).json({ message: 'User not found' });
    }

    bcrypt.compare(password, row.password, (err, result) => {
      if (err) {
        console.log('Error comparing passwords:', err);
        return res.status(500).json({ message: 'Error comparing passwords' });
      }
      if (result) {
        const token = jwt.sign({ userID: row.userID, role: row.role }, process.env.JWT_SECRET);
        console.log('Generated Token:', token);
        res.json({
          token,
          role: row.role,
          redirectUrl: row.role === 'admin' ? '/admin' : '/dashboard'
        });
        console.log('Response sent with token and role');
      } else {
        console.log('Invalid password');
        res.status(401).json({ message: 'Invalid password' });
      }
    });
  });
});

// إضافة الميدلوير للتحقق من التوكن إلى صفحة /dashboard
app.get('/dashboard', authenticateToken, (req, res) => {
  console.log('Accessing dashboard');
  res.send('Dashboard Page');
});

app.get('/admin', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    console.log('Unauthorized admin access attempt');
    return res.status(403).json({ message: 'Access denied' });
  }
  res.send('Welcome to the admin page');
});

// المزيد من المسارات...

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
