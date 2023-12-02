// Importing required modules
const express = require("express");
const cookieParser = require("cookie-parser");
const morgan = require('morgan');
const bcrypt = require('bcryptjs');

// Creating Express app
const app = express();
const PORT = 8080; // default 8080
const salt = bcrypt.genSaltSync(10);
app.set("view engine", "ejs");

////////////////////////////////////////////////////////////////////////////////
// Middleware setup
////////////////////////////////////////////////////////////////////////////////

app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));
app.use(cookieParser())

// Database of URLs and Users
const urlDatabase = {
  b6UTcQ: {
    longURL: "https://www.tsn.ca",
    userID: "aj48lW",
  },
  i3BoGr: {
    longURL:"https://www.google.ca",
    userID: "aJ48lW",
  },
  // "b2xVn2": "http://www.lighthouselabs.ca",
  // "9sm5xK": "http://www.google.com"
};

const users = {
  uniqueId1: {
    user_id: 'uniqueId1',
    email: 'user@example.com',
    password: 'password1'
  },
  uniqueId2: {
    user_id: 'uniqueId2',
    email: 'user2@example.com',
    password: 'password22'
  }
};


const urlsForUser = function(id) {
  const userURLs = {};
  
  for (const shortURL in urlDatabase) {
    if (urlDatabase[shortURL].userID === id) {
      userURLs[shortURL] = urlDatabase[shortURL];
    }
  }
  return userURLs;
}

////////////////////////////////////////////////////////////////////////////////
// Routes
////////////////////////////////////////////////////////////////////////////////

// Root route
app.get("/", (rep, res) => {
  res.send("Hello!");
});

// Display URLs in JSON format
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

// Display user's URLs
app.get('/urls', (req, res) => {
  const user_id = req.cookies.user_id;
  if (!user_id || !users[user_id]) {
    res.status(401).send('<p>Please log in or register to access URL</p>');
    return;
  }

  const user = users[user_id];
  const email = user && user.email ? user.email : null;
  const userURLs = urlsForUser(user_id);
  const templateVars = {
    user: user,
    email: email,
    urls: userURLs
  };
  res.render('urls_index', templateVars);
});

// form to create new URL
app.get("/urls/new", (req, res) => {
  const user_id = req.cookies.user_id;
  const user = user_id ? users[user_id] : null;
  const templateVars = {
    user: user,
  };
  res.render("urls_new", templateVars);
});

// redirect to long URL
app.get("/u/:id", (req, res) => {
  const id = req.params.id;
  const longURL = urlDatabase[id] ? urlDatabase[id].longURL : null;

  // if shortURL does not exist, show error
  if (!longURL) {
    res.status(404).send('<p>URL is not found. Please check the provided URL.</p>')
    return;
  }

  res.redirect(longURL);
});


// // POST EDIT URL
app.post("/urls/:id/edit", (req, res) => {
  const user_id = req.cookies.user_id;
  if (!user_id) {
    res.status(401).send('<p>Please log in or register to access URL</p>');
    return;
  }

  const idToUpdate = req.params.id;
  const userURLs = urlsForUser(user_id);
  if (!userURLs[idToUpdate]) {
    res.status(403).send('<p>You do not have permission to access this page.</p>');
    return;
  }

  console.log("idToUpdate", idToUpdate);
  const newLongURL = req.body.longURL;

  urlDatabase[idToUpdate].longURL = newLongURL;
  console.log("urlDatabase", urlDatabase);
  res.redirect("/urls");
});

// // POST DELETE URL
app.post("/urls/:id/delete", (req, res) => {
  const user_id = req.cookies.user_id;
  if (!user_id) {
    res.status(401).send('<p>Please log in or register to access URL</p>');
    return;
  }

  const idToDelete = req.params.id;
  const userURL = urlForUser(user_id);
  if (!userURLs[idToDelete]) {
    res.status(403).send('<p>You do not have permission to access this page.</p>');
    return;
  }

  console.log("idToDelete", idToDelete);
  delete urlDatabase[idToDelete];
  console.log("urlDatabase", urlDatabase);
  res.redirect("/urls");
});


// // login form
app.get('/login', (req, res) => {
  const user_id = req.cookies.email;

   if(user_id) {
     res.redirect('/urls');
   } else {
    res.render('login');
   }
});

// // POST /login - process login
app.post('/login', (req, res) => {
  const { email, password } = req.body;
  // is email or pass empty?
   if (!email || !password) {
    res.status(403).send('<p>Email and password required. Please provide the correct information.</p>');
    return;
  }
  // finds the user by email
  let user = null;
  for(const id in users) {
    const dataUser = users[id];

    if(users[id].email === email) {
        user = users[id];
        break;
    }
  }
  // No users found
  if (!user) {
    res.status(403).send('<p>Email cannot be found. Please register for an account</p>');
    return;
  }
  // does password match
  if (password !== user.password) {
    res.status(403).send('<p>Password does not match with email.  Please enter correct email or password.</p>')
  }

    res.cookie('user_id', user.id);
    res.redirect('/urls');
});


// // Register
app.get('/register', (req, res) => {
  const user_id = req.cookies['user_id'];
  const user = users[user_id];
  const templateVars = {
    email: user ? user.email : null,
    user
  };

  res.render('register', templateVars)
})

// // process register
app.post('/register', (req, res) => {
  const { email, password } = req.body;
  // is email empty?
   if (!email || !password) {
    res.status(400).send('<p>email or Password not filled. Please provide the correct information.</p>');
    return;
  }

  // is email already registered?
  for (const userId in users) {
    if (users[userId].email === email) {
      res.status(400). send('<p>Email has already been registered. Please use a different email.</p>');
      return;
    }
  }
  // email is unique, create new user object
  const id = Math.random().toString(36).substring(2, 5);;
  // generate the hash
  const salt = bcrypt.genSaltSync(10);
  const hash = bcrypt.hashSync(password, salt);
  users[id] = {
    id,
    email,
    password: hash,
  };
  res.cookie('user_id', id);

  console.log(users);
  res.redirect('/urls');
});

// // LOGOUT
app.post('/logout', (req, res) => {
  const { email, password } = req.body;

  if (!bcrypt.compareSync(password, user.password)) {
    res.status(403).send('<p>Incorrect password. Please correct email or password.</p>')
  }
  res.clearCookie('email');
  res.redirect('/login');
});

// display specific URL
app.get("/urls/:id", (req, res) => {
  const user_id = req.cookies.user_id;
  if (!user_id) {
    res.status(401).send('<p>Please log in or register to access URL</p>');
    return;
  }

  const idToShow = req.params.id;
  const userURLs = urlsForUser(user_id);
  if (!userURLs[idToShow]) {
    res.status(403).send('<p>You do not have permission to access this page.</p>');
    return;
  }

  const templateVars = { id: req.params.id, longURL: urlDatabase[req.params.id] };
  res.render("urls_show", templateVars);
});

// Create new URL
app.post("/urls", (req, res) => {
  const longURL = req.body.longURL;
  const shortURL = generateRandomString();
  const user_id = req.cookies.user_id;
  urlDatabase[shortURL] = {
    longURL: longURL,
    userID: user_id,
  };
  res.redirect(`/urls/${shortURL}`);
});

// Help generate strings
function generateRandomString() {
  const alphabet = 'abcdefghijklmnopqrstuvwxyz';
  let randomString = '';

  for (let i = 0; i < 6; i++) {
    const index = Math.floor(Math.random() * alphabet.length);
    randomString += alphabet[index];
  }
  return randomString;
}

// start the server
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});