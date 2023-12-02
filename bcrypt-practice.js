const bcrypt = require('bcryptjs');

const plaintextPassword = 'monkeyFuzz';

const salt = bcrypt.genSaltSync(10);

console.log('salt:', salt);

bcrypt.hashSync(plaintextPassword);