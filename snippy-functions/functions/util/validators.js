//Creating a helper functions to aid with validation of data inputs
//Checking if 'email' matches that of the regular expression
const isEmailValid = (userEmail) => {
  const validEmailRegEx = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  if (userEmail.match(validEmailRegEx)) return true;
  else return false;
};
//Checking for if the field is empty
const isFieldEmpty = (userInput) => {
  if (userInput.trim() === "") return true;
  else return false;
};

//Export signup validation function
exports.validateSignUp = (userData) => {
  //Validate input fields data
  let errors = {}; // Holds any error

  //Checking for empty and valid email with helper functions
  if (isFieldEmpty(userData.email)) {
    errors.email = "This field must not be empty.";
  } else if (!isEmailValid(userData.email)) {
    errors.email = "Please input a valid email address.";
  }
  //Checking for empty password and user name fields / matching passwords
  if (isFieldEmpty(userData.password))
    errors.password = "This field must not be empty.";
  if (userData.password !== userData.confirmPassword)
    errors.confirmPassword = "Your passwords must match.";
  if (isFieldEmpty(userData.userName))
    errors.userName = "This field must not be empty.";

  //Checking for is 'errors' holds any errors, if not, no errors occurred
  return {
    errors,
    valid: Object.keys(errors).length === 0 ? true : false,
  };
};

//Export login validation function *userLogin
exports.validateUserLogin = (userData) => {
  //Hold any errors
  let errors = {};

  if (isFieldEmpty(userData.email)) {
    errors.email = "This field must not be empty.";
  }
  if (isFieldEmpty(userData.password)) {
    errors.password = "This field must not be empty.";
  }
  //Checking 'errors' to be empty -> no errors
  return {
    errors,
    valid: Object.keys(errors).length === 0 ? true : false,
  };
};
