const { db } = require("../util/admin");
const firebaseConfig = require("../util/firebaseConfig");

const firebase = require("firebase");
firebase.initializeApp(firebaseConfig);

const { validateSignUp, validateUserLogin } = require("../util/validators");

exports.signUp = (req, res) => {
  const newUserInfo = {
    email: req.body.email,
    password: req.body.password,
    confirmPassword: req.body.confirmPassword,
    userName: req.body.userName,
  };

  const { valid, errors } = validateSignUp(newUserInfo);
  if (!valid) return res.status(400).json(errors);

  //Validate user account creation with userName uniqueness
  let token, userId;
  db.doc(`/users/${newUserInfo.userName}`)
    .get()
    .then((doc) => {
      if (doc.exists) {
        //Check for if userName is already taken / in use
        return res.status(400).json({
          userName: "This user name is already in use by another user.",
        });
      } else {
        //else create user
        return firebase
          .auth()
          .createUserWithEmailAndPassword(
            newUserInfo.email,
            newUserInfo.password
          );
      }
    }) //Get user token for reuse
    .then((data) => {
      userId = data.user.uid;
      return data.user.getIdToken();
    }) //creating a doc to store user sign up info
    .then((tokenId) => {
      token = tokenId;
      const userCredentials = {
        userName: newUserInfo.userName,
        email: newUserInfo.email,
        createdAt: new Date().toISOString(),
        userId,
      };
      //Create / write to the user collection / add new user and assign doc to hold user creds
      return db.doc(`/users/${newUserInfo.userName}`).set(userCredentials);
    })
    .then(() => {
      //return user id token
      return res.status(200).json({ token });
    })
    //if error, catch the error
    .catch((err) => {
      console.error(err);
      //If the error code is related to email uniqueness
      if (err.code === "auth/email-already-in-use") {
        return res
          .status(400) //Client error
          .json({ email: "Sorry, this email is already in use." });
      } else {
        return res.status(500).json({ error: err.code });
      }
    });
};

exports.userLogin = (req, res) => {
  const userLogin = {
    email: req.body.email,
    password: req.body.password,
  };

  const { valid, errors } = validateUserLogin(userLogin);
  if (!valid) return res.status(400).json(errors);

  firebase
    .auth()
    .signInWithEmailAndPassword(userLogin.email, userLogin.password)
    .then((data) => {
      return data.user.getIdToken();
    })
    .then((token) => {
      return res.json({ token });
    })
    .catch((err) => {
      if (err.code === "auth/wrong-password") {
        //403 unauthorised error code
        return res
          .status(403)
          .json({ general: "Incorrect credentials, please try again." });
      } else {
        console.error(err);
        return res.status(500).json({ error: err.code });
      }
    });
};
