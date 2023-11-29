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

// DELETE
app.post("/urls/:id/delete", (req, res) => {
  const idToDelete = req.params.id;
  console.log("idToDelete", idToDelete);
  delete urlDatabase[idToDelete];
  console.log("urlDatabase", urlDatabase);
  res.redirect("/urls");
});

// read/output cookie data
app.get('/read-cookies', (req, res) => {
  const cookies = req.cookies;
  const templateVars = {
    value: cookies
  };

  // console.log('cookies:', cookies);
  res.render('read-cookies')
});

// set cookies
app.get('/read-cookeis', (req, res) => {

});

// delete cookies
app.get('/read-cookeis', (req, res) => {

});

// app.post("/login", (req, res) => {
//   const username = req.body.username;
//   res.cookie("username", username);
//   res.redirect("/urls");
// })


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

