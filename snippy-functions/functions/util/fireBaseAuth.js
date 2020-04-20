const { fireAdmin, db } = require("./admin");

//Creating a middleware for user validation
module.exports = (req, res, next) => {
  let tokenId;
  if (
    req.headers.authorization &&
    req.headers.authorization.split(" ")[0] === "Bearer"
  ) {
    tokenId = req.headers.authorization.split(" ")[1]; //extract token with split -> [1] holds token [0] hold Bearer
  } else {
    //if failing to obtain token
    console.error("Sorry, no token was found.");
    return res.status(403).json({ error: "Not authorized" });
  }

  fireAdmin
    .auth()
    .verifyIdToken(tokenId)
    .then((splitToken) => {
      req.user = splitToken;
      console.log(splitToken);
      return db
        .collection("users")
        .where("userId", "==", req.user.uid)
        .limit(1)
        .get();
    })
    .then((data) => {
      req.user.userName = data.docs[0].data().userName;
      req.user.imageUrl = data.docs[0].data().imageUrl; //user profile pic
      return next();
    })
    .catch((err) => {
      console.error("Error while trying to verify the token", err);
      return res.status(403).json(err);
    });
};
