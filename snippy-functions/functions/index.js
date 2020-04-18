const functions = require("firebase-functions");

const express = require("express");
const app = express();

const FireBaseAuth = require("./util/fireBaseAuth");

const { getAllSnips, postSnip } = require("./handlers/snips");
const { signUp, userLogin } = require("./handlers/users");

//Snippy Routes
//Retriving the stored snips from snips route
app.get("/snips", getAllSnips);
//Posting a new snippet from snips route
app.post("/snip", FireBaseAuth, postSnip);

//User account creation / sign up
app.post("/signup", signUp);
//Setting up the login
app.post("/login", userLogin);

//Export to api/...
//Set region to europe from default of US-central to reduce communication times
exports.api = functions.region("europe-west1").https.onRequest(app);
