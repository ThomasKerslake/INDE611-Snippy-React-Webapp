const fireAdmin = require("firebase-admin");
fireAdmin.initializeApp();
const db = fireAdmin.firestore();

module.exports = { fireAdmin, db };
