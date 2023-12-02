// Importing required modules
const express = require("express");
//const cookieParser = require("cookie-parser");
const morgan = require('morgan');
const cookieSession = require('cookie-session');
const bcrypt = require('bcryptjs');

// Creating Express app
const app = express();
const PORT = 8080; // default 8080
//const salt = bcrypt.genSaltSync(10);
app.set("view engine", "ejs");

/*
[] Change everything referencing cookies to session 
[] Go through route and fix passing in an email and just pass in the user

*/
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

// // Display URLs in JSON format
// app.get("/urls.json", (req, res) => {
//   res.json(urlDatabase);
// });

// app.get("/hello", (req, res) => {
//   res.send("<html><body>Hello <b>World</b></body></html>\n");
// });

// Display user's URLs
app.get('/urls', (req, res) => {
  const templateVars = {
    user: users[req.session.user_id],
    urls: urlsForUser(req.session.user_id, urlDatabase)
  };
  res.render('urls_index', templateVars);
});

// form to create new URL
app.get("/urls/new", (req, res) => {
  const user_id = req.session.user_id;
  const user = user_id ? users[user_id] : null;
  const templateVars = {
    user: user,
  };
  res.render("urls_new", templateVars);
});

// redirect to long URL
app.get("/u/:id", (req, res) => {
  const id = req.params.id;
  const longURL = urlDatabase[id].longURL

  // if shortURL does not exist, show error
  if (!longURL) {
    res.status(404).send('<p>URL is not found. Please check the provided URL.</p>')
    return;
  }

  res.redirect(longURL);
});


// // POST EDIT URL
app.post("/urls/:id/edit", (req, res) => {
  const user_id = req.session.user_id;
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

  const newLongURL = req.body.longURL;

  urlDatabase[idToUpdate].longURL = newLongURL;
  res.redirect("/urls");
});

// // POST DELETE URL
app.post("/urls/:id/delete", (req, res) => {
  const user_id = req.session.user_id;
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

  delete urlDatabase[idToDelete];
  res.redirect("/urls");
});


// // login form
app.get('/login', (req, res) => {
  const user_id = req.session.user_id;

   if(user_id) {
     res.redirect('/urls');
   } else {
    res.render('login', { user: user_id });
   }
});

// // POST /login - process login
app.post('/login', (req, res) => {
  const { email, password } = req.body;

  console.log("Login Attempt:", email, password);

    // is email or pass empty?
    if (!email || !password) {
      res.status(403).send('<p>Email and password required. Please provide the correct information.</p>');
      return;
    }

  // find user by email
  let user = Object.values(users).find(user => user.email === email);
  
  if (!user || !bcrypt.compareSync(password, user.password)) {
    res.status(403).send('<p>Email cannot be found. Please register for an account</p>');
    return;
  }
  // finds the user by email
  // user = null;
  // for(const id in users) {
  //   //const dataUser = users[id];

  //   if(users[id].email === email) {
  //       user = users[id];
  //       break;
  //   }
  // }

    req.session.user_id = user.user_id;
    res.redirect('/urls');
});

// // LOGOUT
app.post('/logout', (req, res) => {
  req.session = null;

  res.redirect('/login');
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
  
console.log('Registration:', email, hash);

  users[id] = {
    id,
    email,
    password: hash,
  };
  
  req.session.user_id = id
  res.redirect('/urls');
});



// display specific URL
app.get("/urls/:id", (req, res) => {
  const user_id = req.session.user_id;
  if (!user_id) {
    res.status(401).send('<p>Please log in or register to access URL</p>');
    return;
  }
// TODO this is broken 
  // const idToShow = req.params.id;
  // const userURLs = urlsForUser(user_id);
  // if (!userURLs[idToShow]) {
  //   res.status(403).send('<p>You do not have permission to access this page.</p>');
  //   return;
  // }
  const templateVars = { id: req.params.id, longURL: urlDatabase[req.params.id].longURL , user: users[req.session.user_id]};
  res.render("urls_show", templateVars);
});

// Create new URL
app.post("/urls", (req, res) => {
  const longURL = req.body.longURL;
  const shortURL = generateRandomString();
  const user_id = req.session.user_id;
  urlDatabase[shortURL] = {
    longURL: longURL,
    userID: user_id,
  };
  res.redirect(`/urls/${shortURL}`);
});



// start the server
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});