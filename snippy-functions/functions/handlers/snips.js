const { db } = require("../util/admin");

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
          body: doc.data().body,
          userHandle: doc.data().userHandle,
          createdAt: doc.data().createdAt,
        });
      });
      return res.json(snips);
    }) //if error, catch the error
    .catch((err) => console.error(err));
};

exports.postSnip = (req, res) => {
  if (req.body.body.trim() === "") {
    return res.status(400).json({ body: "This body must not be empty." });
  }

  const newSnip = {
    body: req.body.body,
    userHandle: req.user.userName, //taken from middleware
    createdAt: new Date().toISOString(), //Set createdAt to JS date -> simplified ISO string format
  };
  //Send new snip to snips collection with success message
  db.collection("snips")
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
};
