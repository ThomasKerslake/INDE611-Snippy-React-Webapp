const functions = require("firebase-functions");
const { db } = require("./util/admin");
const express = require("express");
const app = express();

//middleware
const AuthMiddlewareFB = require("./util/fireBaseAuth");

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
  getUserInfo,
  setNotificationsAsRead,
} = require("./handlers/users");

//Snippy Routes
//Posting a new snippet from snips route
app.post("/snip", AuthMiddlewareFB, postSnip);
//Retriving the stored snips from snips route
app.get("/snips", getAllSnips);
//Getting a single snip post
app.get("/snip/:snipId", getOneSnip);
//Posting new comments to a snip
app.post("/snip/:snipId/comment", AuthMiddlewareFB, commentOnSnip);
//likes for a snip
app.get("/snip/:snipId/like", AuthMiddlewareFB, likeSnip);
//Unliking a snip
app.get("/snip/:snipId/unlike", AuthMiddlewareFB, unlikeSnip);
//Give a user the ablity to delete one of their snips
app.delete("/snip/:snipId", AuthMiddlewareFB, deleteUserSnip);

//User account creation / sign up
app.post("/signup", signUp);
//Setting up the login
app.post("/login", userLogin);
//Setting up user image uploading
app.post("/user/image", AuthMiddlewareFB, userImageUpload);
//Adding details to a user account
app.post("/user", AuthMiddlewareFB, expandUserInfo);
//Get info for an authorised user (logged in)
app.get("/user", AuthMiddlewareFB, authorisedUser);
//Grab a users puplic info for user page
app.get("/user/:userName", getUserInfo);
//Marking user notifications as read
app.post("/notifications", AuthMiddlewareFB, setNotificationsAsRead);

//Export to api/...
//Set region to europe from default of US-central to reduce communication times
exports.api = functions.region("europe-west1").https.onRequest(app);

//Using cloud firestore triggers to watch for a document change (like) -> send user notification
exports.generateUserNotificationOnLike = functions
  .region("europe-west1")
  .firestore.document("likes/{id}")
  .onCreate((likeSnapshot) => {
    db.doc(`/snips/${likeSnapshot.data().snipId}`) //Get snip -> chain likesnapshot
      .get()
      .then((doc) => {
        if (doc.exists) {
          return db.doc(`/notifications/${likeSnapshot.id}`).set({
            recipient: doc.data().userHandle,
            sender: likeSnapshot.data().userHandle,
            read: false,
            snipId: doc.id,
            type: "like",
            createdAt: new Date().toISOString(),
          });
        } else {
          return console.log(
            "error: Notification not sent, doc does not exist"
          );
        }
      })
      .then(() => {
        return;
      })
      .catch((err) => {
        console.error(err);
        return;
      });
  });

//firestore triggers to watch for a document change (unlike) -> remove user notification
exports.deleteUserNotificationOnUnlike = functions
  .region("europe-west1")
  .firestore.document("likes/{id}")
  .onDelete((unlikeSnapshot) => {
    //unlikesnap.id == same as notification id
    db.doc(`/notifications/${unlikeSnapshot.id}`)
      .delete()
      .then(() => {
        return;
      })
      .catch((err) => {
        console.error(err);
        return;
      });
  });

//Using cloud firestore triggers to watch for a document change (comment) -> send user notification
exports.generateUserNotificationOnComment = functions
  .region("europe-west1")
  .firestore.document("comments/{id}")
  .onCreate((commentSnapshot) => {
    db.doc(`/snips/${commentSnapshot.data().snipId}`) //Get snip -> chain commentsnapshot
      .get()
      .then((doc) => {
        if (doc.exists) {
          return db.doc(`/notifications/${commentSnapshot.id}`).set({
            recipient: doc.data().userHandle,
            sender: commentSnapshot.data().userHandle,
            read: false,
            snipId: doc.id,
            type: "comment",
            createdAt: new Date().toISOString(),
          });
        } else {
          return console.log(
            "error: Notification not sent, doc does not exist"
          );
        }
      })
      .then(() => {
        return;
      })
      .catch((err) => {
        console.error(err);
        return;
      });
  });
