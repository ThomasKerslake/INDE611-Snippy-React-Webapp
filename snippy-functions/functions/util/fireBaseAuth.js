const { fireAdmin } = require("./admin");

//Creating a middleware for user validation
module.exports = (req, res, next) => {
  let tokenId;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer ")
  ) {
    tokenId = req.headers.authorization.split("Bearer ")[1]; //extract token
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
      return next();
    })
    .catch((err) => {
      console.error("Error while trying to verify the token", err);
      return res.status(403).json(err);
    });
};
