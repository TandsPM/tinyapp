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
  for (let userId in database) {
    if (database[userId].email === email) {
      return database[userId];
    }
  }
  return undefined;
};

const findUser = function(req, value, database) {
  for (let user in database) {
    if (database[user][value] === req.body[value]) {
      return database[user];
    }
  }
  return undefined;
};

module.exports = { generateRandomString, getUserByEmail, findUser };