const functions = require("firebase-functions");
const fireAdmin = require("firebase-admin");
fireAdmin.initializeApp();
const express = require("express");
const app = express();

//Retriving the stored snips
app.get("/snips", (req, res) => {
  //From collection 'snips' get each entry, store in arrary -> to json
  fireAdmin
    .firestore()
    .collection("snips")
    .orderBy("createdAt", "desc") //Get createdAt time, order descending from latest
    .get()
    .then((data) => {
      let snips = [];
      data.forEach((doc) => {
        snips.push({
          //... not supported
          snipId: doc.id, //attaching each snip ID
          body: doc.data().body,
          userHandle: doc.data().userHandle,
          createdAt: doc.data().createdAt,
        });
      });
      return res.json(snips);
    })
    .catch((err) => console.error(err));
});

//Creating a newSnip
app.post("/snip", (req, res) => {
  //New Snippet parms
  const newSnip = {
    body: req.body.body,
    userHandle: req.body.userHandle,
    createdAt: new Date().toISOString(), //Set createdAt to JS date -> simplified ISO string format
  };
  //Send new snip to snips collection with success message
  fireAdmin
    .firestore()
    .collection("snips")
    .add(newSnip)
    .then((doc) => {
      res.json({
        message: `Document with doc ID of: ${doc.id}, creation sucessfull`,
      });
    })
    .catch((err) => {
      //error 500, server error
      res.status(500).json({ error: "Oops, it went wrong!" });
      console.error(err);
    });
});

//Export to api/...
//Set region to europe from default of US-central to reduce communication times
exports.api = functions.region("europe-west1").https.onRequest(app);
