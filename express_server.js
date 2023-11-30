const express = require("express");
const cookieParser = require("cookie-parser");
const morgan = require('morgan');

const app = express();
const PORT = 8080; // default 8080
app.set("view engine", "ejs");

app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));
app.use(cookieParser())

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const users = {
  uniqueId1: {
    id: 'uniqueId1',
    username: 'tpm',
    password: 'password1'
  },
  uniqueId2: {
    id: 'uniqueId2',
    username: 'Louman',
    password: 'iamdoggo'
  }
};


app.get("/", (rep, res) => {
  res.send("Hello!");
});


app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/urls", (req, res) => {
  const templateVars = { urls: urlDatabase };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});

app.get("/u/:id", (req, res) => {
  const id = req.params.id;
  const longURL = urlDatabase[id];
  res.redirect(longURL);
});

// // EDIT
app.post("/urls/:id/edit", (req, res) => {
  const idToUpdate = req.params.id;
  console.log("idToUpdate", idToUpdate);
  const newLongURL = req.body.longURL;

  urlDatabase[idToUpdate] = newLongURL;
  console.log("urlDatabase", urlDatabase);
  res.redirect("/urls");
});

// DELETE URL
app.post("/urls/:id/delete", (req, res) => {
  const idToDelete = req.params.id;
  console.log("idToDelete", idToDelete);
  delete urlDatabase[idToDelete];
  console.log("urlDatabase", urlDatabase);
  res.redirect("/urls");
});

// // read/output cookie data
// app.get('/read-cookies', (req, res) => {
//   const cookies = req.cookies;
//   const templateVars = {
//     value: cookies
//   };

//   // console.log('cookies:', cookies);
//   res.render('read-cookies', templateVars);
// });

// // set cookies
// app.get('/set-cookies', (req, res) => {
//   res.cookie('setCookie', '🍪🍪🍪');

//   res.redirect('/read-cookies');
// });

// // delete cookies
// app.get('/delete-cookies', (req, res) => {
//   for(const key in req.cookies) {
//     res.clearCookie(key);
//   }

//   res.redirect('/read-cookies');
// });


// // /login form
app.get('/login', (req, res) => {
  const cookies = req.cookies;
  const idOfUser = cookies.idOfUser;

   if(idOfUser) {
     res.redirect('/urls');
   }

  res.render('login');
});

// // POST /login - set cookie to show who we are - redirect to protected page
app.post('/login', (req, res) => {
  const body = req.body;

  const username = body.username;
  const password = body.password;

  let user = null;

  for(const id in users) {
    const dataUser = users[id];

    if(username === dataUser.username) {
      if(password === dataUser.password) {
        user = dataUser;
      }
    }
  }

  if (user) {
    res.cookie('idOfUser', user.id);
    res.redirect('/urls');
  } else {
    res.status(401).end('<p>Incorrect user or password</p>');
  }
});

// // sign out
// app.post('/logout', (req, res) => {
//   res.clearCookies('idOfUser');
//   res.redirect('/login');
// });




app.get("/urls/:id", (req, res) => {
  const templateVars = { id: req.params.id, longURL: urlDatabase[req.params.id] };
  res.render("urls_show", templateVars);
});


app.post("/urls", (req, res) => {
  const longURL = req.body.longURL;
  const shortURL = generateRandomString();
  urlDatabase[shortURL] = longURL;
  res.redirect(`/urls/${shortURL}`);
});

function generateRandomString() {
  const alphabet = 'abcdefghijklmnopqrstuvwxyz';
  let randomString = '';

  for (let i = 0; i < 6; i++) {
    const index = Math.floor(Math.random() * alphabet.length);
    randomString += alphabet[index];
  }
  return randomString;
}

