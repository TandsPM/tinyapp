const urlsForUser = function(id) {
  const userURLs = {};

  for (const shortURL in urlDatabase) {
    if (urlDatabase[shortURL].userID === id) {
      userURLs[shortURL] = urlDatabase[shortURL];
    }
  }
  return userURLs;
};

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

const getUserByEmail = function(email, database) {
  for (let user in database)
 {
  if (database[user]['email'] === email) {
    return database[user].id;
  }
 }
};

const findUser = function(req, value, database = users) {
  for (let user in database) {
    if (database[user][value] === req.body[value]) {
      return database[user];
    }
  }
  return undefined;
};

module.exports = helpers;