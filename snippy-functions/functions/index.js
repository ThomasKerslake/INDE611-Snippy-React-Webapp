const functions = require("firebase-functions");

const express = require("express");
const app = express();

//middleware
const FireBaseAuth = require("./util/fireBaseAuth");

const { getAllSnips, postSnip } = require("./handlers/snips");
const { signUp, userLogin, userImageUpload } = require("./handlers/users");

//Snippy Routes
//Posting a new snippet from snips route
app.post("/snip", FireBaseAuth, postSnip);
//Retriving the stored snips from snips route
app.get("/snips", getAllSnips);

//User account creation / sign up
app.post("/signup", signUp);
//Setting up the login
app.post("/login", userLogin);
//Setting up user image uploading
app.post("/user/image", FireBaseAuth, userImageUpload);

//Export to api/...
//Set region to europe from default of US-central to reduce communication times
exports.api = functions.region("europe-west1").https.onRequest(app);
