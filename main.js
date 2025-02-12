// main.js (Electron main process)
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

let mainWindow;
const db = new sqlite3.Database('users.db');

// Ensure the users table includes name and lastname
db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    lastname TEXT,
    username TEXT UNIQUE,
    password TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
)`);

app.whenReady().then(() => {
    mainWindow = new BrowserWindow({
        width: 1000,
        height: 800,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
        }
    });
    mainWindow.loadFile('login.html');
});

// Handle user login
ipcMain.on('login', (event, { username, password }) => {
    db.get('SELECT * FROM users WHERE username = ? AND password = ?', [username, password], (err, row) => {
        if (err) {
            event.reply('login-reply', { success: false, message: 'Database error' });
        } else if (row) {
            event.reply('login-reply', { success: true, message: 'Login successful', redirect: 'dashboard.html' });
        } else {
            event.reply('login-reply', { success: false, message: 'Invalid credentials' });
        }
    });
});

// Handle user signup
ipcMain.on('signup', (event, { name, lastname, username, password }) => {
    db.run(
        'INSERT INTO users (name, lastname, username, password) VALUES (?, ?, ?, ?)',
        [name, lastname, username, password],
        function (err) {
            if (err) {
                console.error("Signup Error:", err.message);
                event.reply('signup-reply', { success: false, message: 'Signup failed. ' + err.message });
            } else {
                event.reply('signup-reply', { success: true, message: 'Signup successful! Redirecting to login...' });
            }
        }
    );
});
