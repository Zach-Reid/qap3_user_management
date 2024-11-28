const express = require("express");
const path = require("path");
const session = require("express-session");
const bcrypt = require('bcrypt');

const app = express();
const PORT = 3000;
const SALT_ROUNDS = 10;

// Store users in the memory
const USERS = [
    {
        id: 1,
        username: "AdminUser", //The admin account
        email: "admin@example.com",
        password: bcrypt.hashSync("admin123", SALT_ROUNDS), // In an actual app, this would be saved as a hashed password
        role: "admin",
    },
    {
        id: 2,
        username: "RegularUser", //A example regular user
        email: "user@example.com",
        password: bcrypt.hashSync("user123", SALT_ROUNDS), // This would, too
        role: "user",
    },
];

// For parsing the form data
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

// Session handling
app.use(
    session({
        secret: "example_secure_key", //Can be switched for a real secure key for the secret
        resave: false,
        saveUninitialized: true,
    })
);

// The View Engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Routes:

// GET / - Rendering the home page (the index page)
app.get("/", (req, res) => {
    if (req.session.user) {
        return res.redirect("/landing");
    }
    res.render("index");
});

// GET /login - Render the login page
app.get("/login", (req, res) => {
    res.render("login", { errorMessage: null });  // Pass errorMessage as null at first
});

// POST /login - Handle the submission of the login forms
app.post("/login", (req, res) => {
    const { email, password } = req.body;
    const user = USERS.find(u => u.email === email);

    if (!user) {
        return res.render("login", { errorMessage: "Invalid email or password" });
    }

    bcrypt.compare(password, user.password, (err, isMatch) => {
        if (err || !isMatch) {
            return res.render("login", { errorMessage: "Invalid email or password" });
        }
        
        // Create a session if the user logs in correctly
        req.session.user = { id: user.id, username: user.username, role: user.role };
        res.redirect("/landing");
    });
});

// GET /signup - Render the signup page
app.get("/signup", (req, res) => {
    res.render("signup", { errorMessage: null });  // Pass errorMessage as null, like above
});

// POST /signup - Handle form submission for signup
app.post("/signup", (req, res) => {
    const { email, username, password } = req.body;
    
    // Check if the user already has the email in use
    const existingUser = USERS.find(u => u.email === email);
    if (existingUser) {
        return res.render("signup", { errorMessage: "Email already taken" });
    }

    // Hash the password before storing it
    bcrypt.hash(password, SALT_ROUNDS, (err, hash) => {
        if (err) return res.render("signup", { errorMessage: "Error during signup" });
        
        // Creating a new user
        const newUser = {
            id: USERS.length + 1, // An auto incrementing ID
            email,
            username,
            password: hash,
            role: "user", // Accounts default as user
        };
        USERS.push(newUser);

        // Automatically log the user in after they sign up
        req.session.user = { id: newUser.id, username: newUser.username, role: newUser.role };
        res.redirect("/landing");
    });
});

// GET /landing - Render the landing page (either the dashboard or admin dashboard)
app.get("/landing", (req, res) => {
    if (!req.session.user) {
        return res.redirect("/login");
    }

    const user = req.session.user;
    if (user.role === "admin") {
        // The admin sees every user
        res.render("landing", { user, allUsers: USERS });
    } else {
        // Regular user sees the regular dashboard
        res.render("landing", { user });
    }
});

// POST /logout - Handle logging out
app.post("/logout", (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.status(500).send("Error logging out");
        }
        res.redirect("/");
    });
});

// Start up the server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});



