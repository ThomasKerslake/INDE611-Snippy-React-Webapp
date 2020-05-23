const { db } = require("../util/admin");

//Getting all the current snips (snippets) user posts
exports.getAllSnips = (req, res) => {
  //From collection 'snips' get each entry, store in arrary -> to json
  db.collection("snips")
    .orderBy("createdAt", "desc") //Get createdAt time, order descending from latest
    .get()
    .then((data) => {
      let snips = [];
      data.forEach((doc) => {
        snips.push({
          //... not supported
          snipId: doc.id, //attaching each snip ID
          snipTitle: doc.data().snipTitle,
          snipDescription: doc.data().snipDescription,
          body: doc.data().body,
          snipType: doc.data().snipType,
          userHandle: doc.data().userHandle,
          createdAt: doc.data().createdAt,
          userProfileImage: doc.data().userProfileImage,
          numOfLikes: doc.data().numOfLikes,
          numOfComments: doc.data().numOfComments,
        });
      });
      return res.json(snips);
    }) //if error, catch the error
    .catch((err) => console.error(err));
};

//Posting a new snippet
exports.postSnip = (req, res) => {
  if (req.body.body.trim() === "") {
    return res.status(400).json({ body: "This body must not be empty." });
  }
  if (req.body.snipTitle.trim() === "") {
    return res
      .status(400)
      .json({ snipTitle: "Your snippet must have a title." });
  }
  if (req.body.snipDescription.trim() === "") {
    return res.status(400).json({
      snipDescription:
        "Your snippet must have a discription of what the snippet is.",
    });
  }
  if (req.body.snipType.trim() === "") {
    return res.status(400).json({
      snipType:
        "Please select from one of the valid snippet types. (More are being added soon!)",
    });
  }
  const newSnip = {
    snipTitle: req.body.snipTitle,
    snipDescription: req.body.snipDescription,
    body: req.body.body,
    snipType: req.body.snipType,
    userHandle: req.user.userName, //taken from middleware
    createdAt: new Date().toISOString(), //Set createdAt to JS date -> simplified ISO string format
    userProfileImage: req.user.imageUrl,
    numOfLikes: 0,
    numOfComments: 0,
  };

  //Send new snip to snips collection with response of the snip back to user
  db.collection("snips")
    .add(newSnip)
    .then((doc) => {
      const responseSnip = newSnip;
      responseSnip.snipId = doc.id; //set
      res.json(responseSnip);
    })
    .catch((err) => {
      //error 500, server error
      res.status(500).json({ error: "Oops, it went wrong!" });
      console.error(err);
    });
};

//Used to filter snippet posts by there post types
exports.getAllSnipsByType = (req, res) => {
  let snips = [];
  db.collection("snips")
    .where("snipType", "==", req.params.snipType)
    .orderBy("createdAt", "desc")
    .get()
    .then((data) => {
      data.forEach((doc) => {
        snips.push({
          snipTitle: doc.data().snipTitle,
          snipDescription: doc.data().snipDescription,
          body: doc.data().body,
          snipType: doc.data().snipType,
          userHandle: doc.data().userHandle,
          createdAt: doc.data().createdAt,
          userProfileImage: doc.data().userProfileImage,
          numOfLikes: doc.data().numOfLikes,
          numOfComments: doc.data().numOfComments,
          snipId: doc.id,
        });
      });
      return res.json(snips);
    })
    .catch((err) => {
      //error 500, server error
      res.status(500).json({ error: err.code });
      console.error(err);
    });
};

//Get a single snippet and all its data
exports.getOneSnip = (req, res) => {
  let snipData = {};
  db.doc(`/snips/${req.params.snipId}`)
    .get()
    .then((doc) => {
      if (!doc.exists) {
        return res.status(404).json({
          error:
            "Sorry, this snippet was not found. (It may not exist anymore!) :(",
        });
      }
      //taking the snip and adding it to snipData
      snipData = doc.data();
      snipData.snipId = doc.id;
      return db
        .collection("comments")
        .orderBy("createdAt", "desc") //Order the comments for newest first
        .where("snipId", "==", req.params.snipId)
        .get();
    })
    //Creating an array for comments within snipData -> push doc.data
    .then((data) => {
      snipData.comments = [];
      data.forEach((doc) => {
        snipData.comments.push(doc.data());
      });
      res.json(snipData);
    })
    .catch((err) => {
      //error 500, server error
      res.status(500).json({ error: err.code });
      console.error(err);
    });
};

//Comment on a snip
exports.commentOnSnip = (req, res) => {
  //If the body of the post is empty (user has not inputed anything) -> return error
  if (req.body.body.trim() === "") {
    return res
      .status(400)
      .json({ comment: "This comment field must not be empty." });
  }
  //Creating a comment json format
  // '.user' obtained though middleware
  const newUserComment = {
    body: req.body.body,
    createdAt: new Date().toISOString(),
    snipId: req.params.snipId,
    userHandle: req.user.userName,
    userProfileImage: req.user.imageUrl,
  };
  //Check if the snippet exists
  db.doc(`/snips/${req.params.snipId}`) //getting this snips id
    .get()
    .then((doc) => {
      if (!doc.exists) {
        return res.status(404).json({
          error:
            "Sorry, this snippet was not found. (It may not exist anymore!) :(",
        });
      }
      //If found increment our number of comments as a new comment is added
      return doc.ref.update({ numOfComments: doc.data().numOfComments + 1 });
    })
    .then(() => {
      //add our comment formated with newUserComment
      return db.collection("comments").add(newUserComment);
    })
    .then(() => {
      res.json(newUserComment); //Show the comment to user
    })
    .catch((err) => {
      res
        .status(500)
        .json({ error: "Sorry! Something seems to have gone wrong." });
      console.error(err);
    });
};

//Like a snippet
exports.likeSnip = (req, res) => {
  //Setting up variables that need to be reused alot
  //Get from collection 'likes' where userhandle of the like is equal to user 'liking' the snip
  const likeDoc = db
    .collection("likes")
    .where("userHandle", "==", req.user.userName)
    .where("snipId", "==", req.params.snipId)
    .limit(1);
  const snipDoc = db.doc(`/snips/${req.params.snipId}`);
  let snipData;

  snipDoc
    .get()
    .then((doc) => {
      if (doc.exists) {
        snipData = doc.data(); //initiating snipData as object
        snipData.snipId = doc.id;
        return likeDoc.get();
      } else {
        return res.status(404).json({
          error:
            "Sorry, this snippet was not found. (It may not exist anymore!) :(",
        });
      }
    })
    .then((data) => {
      if (data.empty) {
        //If empty -> no likes
        return (
          db
            .collection("likes")
            .add({
              snipId: req.params.snipId,
              userHandle: req.user.userName,
            })
            //Increment num of likes
            .then(() => {
              snipData.numOfLikes++;
              //Passing back num of likes from snipData to snipDoc
              return snipDoc.update({ numOfLikes: snipData.numOfLikes });
            })
            .then(() => {
              return res.json(snipData);
            })
        );
      } else {
        return res
          .status(400)
          .json({ error: "You have already liked this snippet!" });
      }
    })
    .catch((err) => {
      console.error(err);
      res.status(500).json({ error: err.code });
    });
};

//Used to unlike a snip post
exports.unlikeSnip = (req, res) => {
  //Setting up variables that need to be reused alot
  //Get from collection 'likes' where userhandle of the like is equal to user 'liking' the snip
  const likeDoc = db
    .collection("likes")
    .where("userHandle", "==", req.user.userName)
    .where("snipId", "==", req.params.snipId)
    .limit(1);
  const snipDoc = db.doc(`/snips/${req.params.snipId}`);
  let snipData;

  snipDoc
    .get()
    .then((doc) => {
      if (doc.exists) {
        snipData = doc.data(); //initiating snipData as object
        snipData.snipId = doc.id;
        return likeDoc.get();
      } else {
        return res.status(404).json({
          error:
            "Sorry, this snippet was not found. (It may not exist anymore!) :(",
        });
      }
    })
    .then((data) => {
      if (data.empty) {
        return res.status(400).json({ error: "Snippet not liked" });
      } else {
        //Get like from doc path -> delete
        return db
          .doc(`/likes/${data.docs[0].id}`)
          .delete()
          .then(() => {
            //decrement numOfLikes
            snipData.numOfLikes--;
            return snipDoc.update({ numOfLikes: snipData.numOfLikes });
          })
          .then(() => {
            res.json(snipData);
          });
      }
    })
    .catch((err) => {
      console.error(err);
      res.status(500).json({ error: err.code });
    });
};

//Used to delete a users snip
exports.deleteUserSnip = (req, res) => {
  //Get the snips id / post -> assign to variable
  const userDocument = db.doc(`/snips/${req.params.snipId}`);
  userDocument
    .get()
    .then((doc) => {
      if (!doc.exists) {
        return res.status(404).json({
          error:
            "Sorry, this snippet could not be deleted as it was not found.",
        });
      }
      //If user does not match that of the posts user handle -> not allowed to delete as its not their snip (post)
      if (doc.data().userHandle !== req.user.userName) {
        return res.status(403).json({
          error: "Unauthorized access. You may not delete this post.",
        });
      } else {
        //Delete the users post
        return userDocument.delete();
      }
    })
    .then(() => {
      res.json({ message: "Your snippet post was successfully deleted!" });
    })
    .catch((err) => {
      console.error(err);
      res.status(500).json({ error: err.code });
    });
};
