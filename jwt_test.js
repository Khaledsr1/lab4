const jwt = require('jsonwebtoken');
require('dotenv').config(); // تحميل المتغيرات من .env

const token = '<your_jwt_token>'; // استبدلها بالتوكن الخاص بك

jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
  if (err) {
    console.log('Token verification failed:', err.message);
  } else {
    console.log('Decoded token:', decoded);
  }
});
