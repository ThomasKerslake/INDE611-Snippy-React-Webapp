const { fireAdmin, db } = require("../util/admin");
const firebaseConfig = require("../util/firebaseConfig");

const firebase = require("firebase");
firebase.initializeApp(firebaseConfig);

const {
  validateSignUp,
  validateUserLogin,
  reduceUserInfo,
} = require("../util/validators");

//Export signup functionality
exports.signUp = (req, res) => {
  const newUserInfo = {
    email: req.body.email,
    password: req.body.password,
    confirmPassword: req.body.confirmPassword,
    userName: req.body.userName,
  };
  //Destructuring
  const { valid, errors } = validateSignUp(newUserInfo);
  if (!valid) return res.status(400).json(errors);
  //Used for the default user image
  const noProfileImage = "default-profile-image.png";
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
        imageUrl: `https://firebasestorage.googleapis.com/v0/b/${firebaseConfig.storageBucket}/o/${noProfileImage}?alt=media`,
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

//Export user login functionality
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

//Give users ability to upload a profile picture
exports.userImageUpload = (req, res) => {
  const BusBoy = require("busboy");
  const os = require("os");
  const fs = require("fs");
  const path = require("path");
  const newBusBoy = new BusBoy({ headers: req.headers });
  let fileNameOfImage;
  let userImageToBeUploaded = {};

  newBusBoy.on("file", (fieldname, file, filename, encoding, mimetype) => {
    //Stopping any files other than jpg / png from being able to be uploaded
    if (mimetype !== "image/jpeg" && mimetype !== "image/png") {
      return res.status(400).json({
        error:
          "Sorry, you submitted the wrong file type. Please submit either a .jpg or .png",
      });
    }
    //Getting the extension of file e.g '.png' -> check for multiple '.'
    //in the file name, get the last occurrence of '.' -> (-1)
    const extensionOfImage = filename.split(".")[
      filename.split(".").length - 1
    ];
    //Creating a generated name for image -> adding back the extension
    fileNameOfImage = `${Math.round(
      Math.random() * 999999999999
    )}.${extensionOfImage}`;

    const filePath = path.join(os.tmpdir(), fileNameOfImage);
    userImageToBeUploaded = { filePath, mimetype };
    file.pipe(fs.createWriteStream(filePath));
  });
  //On finish -> upload users image
  newBusBoy.on("finish", () => {
    fireAdmin
      .storage()
      .bucket()
      .upload(userImageToBeUploaded.filePath, {
        resumable: false,
        metadata: {
          metadata: {
            contentType: userImageToBeUploaded.mimetype,
          },
        },
      })
      //Construct snippy firebase storage bucket link
      //-> add image name -> using alt=media to display image on link and not download
      .then(() => {
        const imageUrl = `https://firebasestorage.googleapis.com/v0/b/${firebaseConfig.storageBucket}/o/${fileNameOfImage}?alt=media`;
        //Get logged in user -> add / update field imageUrl to hold users uploaded image (imageUrl)
        return db.doc(`/users/${req.user.userName}`).update({ imageUrl });
      })
      .then(() => {
        return res.json({ message: "Your image was uploaded successfully" });
      })
      .catch((err) => {
        console.error(err);
        return res.status(500).json({ error: err.code });
      });
  });
  newBusBoy.end(req.rawBody); //End busboy
};

//Expanding a users detials
exports.expandUserInfo = (req, res) => {
  let infoFromUser = reduceUserInfo(req.body);
  db.doc(`/users/${req.user.userName}`)
    .update(infoFromUser)
    .then(() => {
      return res.json({
        message: "Your details have been added / updated successfully.",
      });
    })
    .catch((err) => {
      console.error(err);
      return res.status(500).json({ error: err.code });
    });
};

//Grab all of a users information
exports.authorisedUser = (req, res) => {
  let responsData = {};
  //Get logged in (authorised) user info
  db.doc(`/users/${req.user.userName}`)
    .get()
    .then((doc) => {
      //Check for its existance to avoid crashing
      if (doc.exists) {
        responsData.credentials = doc.data();
        //Return a users likes where name on userHandle = current user (userName)
        return db
          .collection("likes")
          .where("userHandle", "==", req.user.userName)
          .get();
      }
    })
    .then((data) => {
      //Create array for likes within responsData
      responsData.likes = [];
      data.forEach((doc) => {
        responsData.likes.push(doc.data());
      });
      return res.json(responsData);
    })
    .catch((err) => {
      console.error(err);
      return res.status(500).json({ error: err.code });
    });
};
