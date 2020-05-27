const functions = require("firebase-functions");
const { db } = require("./util/admin");
const express = require("express");
const app = express();
//Set app to use cors for headers / allowing requests
const cors = require("cors");
app.use(cors());
//middleware
const AuthMiddlewareFB = require("./util/fireBaseAuth");

const {
  getAllSnips,
  getOneSnip,
  postSnip,
  userCommentOnSnip,
  userLikeSnip,
  userUnlikeSnip,
  deleteUserSnip,
  getAllSnipsByType,
} = require("./handlers/snips");
const {
  userSignup,
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
//Retriving the stored snips from snips route from given snip type
app.get("/snips/:snipType", getAllSnipsByType);
//Getting a single snip post
app.get("/snip/:snipId", getOneSnip);
//Posting new comments to a snip
app.post("/snip/:snipId/comment", AuthMiddlewareFB, userCommentOnSnip);
//likes for a snip
app.get("/snip/:snipId/like", AuthMiddlewareFB, userLikeSnip);
//Unliking a snip
app.get("/snip/:snipId/unlike", AuthMiddlewareFB, userUnlikeSnip);
//Give a user the ablity to delete one of their snips
app.delete("/snip/:snipId", AuthMiddlewareFB, deleteUserSnip);

//User account creation / sign up
app.post("/signup", userSignup);
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
    return db
      .doc(`/snips/${likeSnapshot.data().snipId}`) //Get snip -> chain likesnapshot
      .get()
      .then((doc) => {
        //Checking post existance AND if username (userhandle) liking the post not == same as post userHandle
        //Send a notification (wont get a notification on liking own posts)
        if (
          doc.exists &&
          doc.data().userHandle !== likeSnapshot.data().userHandle
        ) {
          return db.doc(`/notifications/${likeSnapshot.id}`).set({
            recipient: doc.data().userHandle,
            sender: likeSnapshot.data().userHandle,
            read: false,
            snipId: doc.id,
            type: "like",
            createdAt: new Date().toISOString(),
          });
        }
      })
      .catch((err) => {
        console.error(err);
      });
  });

//firestore triggers to watch for a document change (unlike) -> remove user notification
exports.deleteUserNotificationOnUnlike = functions
  .region("europe-west1")
  .firestore.document("likes/{id}")
  .onDelete((unlikeSnapshot) => {
    //unlikesnap.id == same as notification id
    return db
      .doc(`/notifications/${unlikeSnapshot.id}`)
      .delete()
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
    return db
      .doc(`/snips/${commentSnapshot.data().snipId}`) //Get snip -> chain commentsnapshot
      .get()
      .then((doc) => {
        if (
          //Same setup as the like notification but for comment snapshots
          doc.exists &&
          doc.data().userHandle !== commentSnapshot.data().userHandle
        ) {
          return db.doc(`/notifications/${commentSnapshot.id}`).set({
            recipient: doc.data().userHandle,
            sender: commentSnapshot.data().userHandle,
            read: false,
            snipId: doc.id,
            type: "comment",
            createdAt: new Date().toISOString(),
          });
        }
      })
      .catch((err) => {
        console.error(err);
        return;
      });
  });

//Seting up a database trigger to watch for users changing their profile images
// If change -> update the users snippet posts with their new image
exports.watchForUserProfileImageChange = functions
  .region("europe-west1")
  .firestore.document("/users/{userId}") //Watch this doc for a change
  .onUpdate((imageChange) => {
    //Checking for just an image change with before and after
    if (
      imageChange.before.data().imageUrl !== imageChange.after.data().imageUrl
    ) {
      let batch = db.batch();
      return db
        .collection("snips")
        .where("userHandle", "==", imageChange.before.data().userName)
        .get()
        .then((data) => {
          data.forEach((doc) => {
            const snip = db.doc(`/snips/${doc.id}`);
            batch.update(snip, {
              userProfileImage: imageChange.after.data().imageUrl,
            });
          });
          return batch.commit();
        });
    } else return true;
  });

//Watching to see is a user deletes a snip -> delete snips comments / likes / notifications
exports.watchForSnipDeletion = functions
  .region("europe-west1")
  .firestore.document("/snips/{snipId}") //Watch this doc for a change
  .onDelete((snipSnapshot, context) => {
    const snipId = context.params.snipId;
    const batch = db.batch();
    //Get collection 'likes' == snipId -> batch delete
    return db
      .collection("likes")
      .where("snipId", "==", snipId)
      .get()
      .then((data) => {
        data.forEach((doc) => {
          batch.delete(db.doc(`/likes/${doc.id}`));
        });
        //get 'comments' collection -> for each delete the batch
        return db.collection("comments").where("snipId", "==", snipId).get();
      })
      .then((data) => {
        data.forEach((doc) => {
          batch.delete(db.doc(`/comments/${doc.id}`));
        });
        //Get the notification collection -> delete batch
        return db
          .collection("notifications")
          .where("snipId", "==", snipId)
          .get();
      })
      .then((data) => {
        data.forEach((doc) => {
          batch.delete(db.doc(`/notifications/${doc.id}`));
        });
        return batch.commit();
      })
      .catch((err) => {
        console.error(err);
      });
  });
