const express = require("express");
//const cookieParser = require("cookie-parser");
const morgan = require('morgan');
const cookieSession = require('cookie-session');
const bcrypt = require('bcryptjs');

const {
  generateRandomString,
  getUserByEmail,
} = require('./helpers');

// Creating Express app
const app = express();
const PORT = 8080; // default 8080
//const salt = bcrypt.genSaltSync(10);
app.set("view engine", "ejs");


////////////////////////////////////////////////////////////////////////////////
// Middleware setup
////////////////////////////////////////////////////////////////////////////////

app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

app.use(cookieSession({
  name: 'session',
  keys: ['secret-key'],
  maxAge: 24 * 60 * 60 * 1000,
}));

// Database of URLs and Users
const urlDatabase = {
  b6UTcQ: {
    longURL: "https://www.tsn.ca",
    userID: "aj48lw",
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "aJ48lw",
  },
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
      userURLs[shortURL] = urlDatabase[shortURL].longURL;
    }
  }
  return userURLs;
};


////////////////////////////////////////////////////////////////////////////////
// Routes
////////////////////////////////////////////////////////////////////////////////

// Root route
app.get("/", (req, res) => {
  if (req.session.user_id) {
    res.redirect("/urls");
  } else {
    res.redirect("/login");
  }
});

// Display user's URLs
app.get('/urls', (req, res) => {
  if (req.session.user_id) {
    const templateVars = {
      user: users[req.session.user_id],
      urls: urlsForUser(req.session.user_id, urlDatabase)
    };
    res.render('urls_index', templateVars);
  } else {
    res.status(401).send('<p>Please log in to access this page.</p>');
  }
});

// Create new URL
app.post("/urls", (req, res) => {
  const user_id = req.session.user_id;
  if (user_id) {
    const longURL = req.body.longURL;
    const shortURL = generateRandomString();
    urlDatabase[shortURL] = {
      longURL: longURL,
      userID: user_id,
    };
    res.redirect(`/urls/${shortURL}`);
  } else {
    res.status(401).send('<p>Please login to create a new URL.</p>');
  }
});

// form to create new URL
app.get("/urls/new", (req, res) => {
  const user_id = req.session.user_id;
  if (user_id) {
    const user = users[user_id];
    const templateVars = {
      user: user,
    };
    res.render("urls_new", templateVars);
  } else {
    res.redirect("/login");
  }
});


// redirect to long URL
app.get("/u/:id", (req, res) => {
  const id = req.params.id;
  const longURL = urlDatabase[id].longURL;

  // if shortURL does not exist, show error
  if (!longURL) {
    res.status(404).send('<p>URL is not found. Please check the provided URL.</p>');
    return;
  }

  res.redirect(longURL);
});

// // POST EDIT URL
app.post("/urls/:id/edit", (req, res) => {
  const user_id = req.session.user_id;
  const idToUpdate = req.params.id;

  if (!urlDatabase[user_id].userID) return res.status(401).send('<p>Please log in to edit any URLs.</p>');

  if (!urlDatabase[idToUpdate]) return res.status(403).send('<p>You do not have permission to edit.</p>');


  const newLongURL = req.body.longURL;
  urlDatabase[idToUpdate].longURL = newLongURL;
  
  res.redirect(`/urls/${idToUpdate}`);
});

// // POST DELETE URL
app.post("/urls/:id/delete", (req, res) => {
  const user_id = req.session.user_id;
  if (!user_id) {
    res.status(401).send('<p>Please log in or register to delete URLs</p>');
    return;
  }

  const idToDelete = req.params.id;
  const userURLs = urlsForUser(user_id);

  if (!userURLs[idToDelete]) {
    res.status(403).send('<p>You do not have permission to delete this.</p>');
    return;
  }

  delete urlDatabase[idToDelete];
  res.redirect("/urls");
});

// // login form
app.get('/login', (req, res) => {
  const user_id = req.session.user_id;

  if (user_id) {
    res.redirect('/urls');
  } else {
    res.render('login', { user: user_id });
  }
});

// // POST /login - process login
app.post('/login', (req, res) => {
  const { email, password } = req.body;
  const currentUser = getUserByEmail(email, users);

  if (!currentUser) {
    res.render('login', { errorMessage: 'Account not found.', user: null });
    return;
  }

  if (bcrypt.compareSync(password, currentUser.password)) {
    req.session.user_id = currentUser.user_id;
    res.redirect('/urls');
  } else {
    res.render('login', { errorMessage: 'Invalid Password, please put in the correct password.', user: null });
  }
});

// // Register
app.get('/register', (req, res) => {
  const user_id = req.session['user_id'];
  const user = users[user_id];
  const templateVars = {
    user: user
  };

  if (user) {
    res.redirect('/urls');
  } else {
    res.render('register', templateVars);
  }
});

// // process register
app.post('/register', (req, res) => {
  const { email, password } = req.body;
  // is email empty?
  if (!email || !password) {
    res.status(400).send('<p>email or Password not filled. Please provide the correct information.</p>');
    return;
  }

  // is email already registered?
  if(getUserByEmail(email, users)) {
    res.status(400).send('<p>Email has already been registered. Please use a different email.</p>');
    return;
  }
  // for (const userId in users) {
  //   if (users[userId].email === email) {
  //     res.status(400).send('<p>Email has already been registered. Please use a different email.</p>');
  //     return;
  //   }
  // };
  // email is unique, create new user object
  // const id = Math.random().toString(36).substring(2, 5);
  // generate the hash
  const salt = bcrypt.genSaltSync(10);
  const hash = bcrypt.hashSync(password, salt);

  console.log('Registration:', email, hash);

  const user_id = email;
  users[user_id] = {
    user_id,
    email,
    password: hash,
  };

  req.session.user_id = user_id;
  res.redirect('/urls');
});

//logout
app.post("/logout", (req, res) => {
  /* res.clearCookie("user_id");  */// clear cookie
  req.session = null; // deletes the cookies
  res.redirect('/login');
});

// display specific URL
app.get("/urls/:id", (req, res) => {
  const user_id = req.session.user_id;
  const urlAccess = urlDatabase[req.params.id];

  if (!urlAccess) {
    res.status(404).send('<p>URL not found.</p>');
    return;
  };

  if (!user_id) {
    res.status(401).send('<p>Please log in to access this page.</p>');
    return;
  };

  if (urlAccess.userID !== user_id) {
    res.status(403).send('<p>You do not have permission to access this.</p>');
    return;
  };

  const templateVars = {
    id: req.params.id,
    longURL: urlAccess.longURL,
    user: users[user_id]
  };
  res.render("urls_show", templateVars);
});

// start the server
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});