const functions = require("firebase-functions");

const express = require("express");
const app = express();

//middleware
const FireBaseAuth = require("./util/fireBaseAuth");

const {
  getAllSnips,
  getOneSnip,
  postSnip,
  commentOnSnip,
  likeSnip,
  unlikeSnip,
  deleteUserSnip,
} = require("./handlers/snips");
const {
  signUp,
  userLogin,
  userImageUpload,
  expandUserInfo,
  authorisedUser,
} = require("./handlers/users");

//Snippy Routes
//Posting a new snippet from snips route
app.post("/snip", FireBaseAuth, postSnip);
//Retriving the stored snips from snips route
app.get("/snips", getAllSnips);
//Getting a single snip post
app.get("/snip/:snipId", getOneSnip);
//Posting new comments to a snip
app.post("/snip/:snipId/comment", FireBaseAuth, commentOnSnip);
//likes for a snip
app.get("/snip/:snipId/like", FireBaseAuth, likeSnip);
//Unliking a snip
app.get("/snip/:snipId/unlike", FireBaseAuth, unlikeSnip);
//Give a user the ablity to delete one of their snips
app.delete("/snip/:snipId", FireBaseAuth, deleteUserSnip);

//User account creation / sign up
app.post("/signup", signUp);
//Setting up the login
app.post("/login", userLogin);
//Setting up user image uploading
app.post("/user/image", FireBaseAuth, userImageUpload);
//Adding details to a user account
app.post("/user", FireBaseAuth, expandUserInfo);
//Get info for an authorised user (logged in)
app.get("/user", FireBaseAuth, authorisedUser);

//Export to api/...
//Set region to europe from default of US-central to reduce communication times
exports.api = functions.region("europe-west1").https.onRequest(app);
