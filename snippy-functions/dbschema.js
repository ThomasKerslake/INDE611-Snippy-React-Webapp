//database schema
let db = {
  users: [
    {
      userId: "2bf903gnfsda032kzmge32b8tnk329cz3n23h3fn39",
      email: "someuser@email.com",
      userName: "someuser",
      createdAt: "2020-04-15T11:46:01.018Z",
      imageUrl: "image/12678318361387",
      bio: "Yo whats up, I am someuser",
      website: "https://someuser.com",
      location: "Some place, Moon",
    },
  ],
  snips: [
    {
      snipTitle: "The title of the snippet",
      snipDescription: "THis will be the description of the snippet",
      body: "This will be the snippet",
      snipType: "CSS",
      userHandle: "user", //taken from middleware
      createdAt: "2020-04-15T11:46:01.018Z", //Set createdAt to JS date -> simplified ISO string format
      userProfileImage: "image/122525781515587",
      numOfLikes: 14,
      numOfComments: 5,
    },
  ],
  comments: [
    {
      userHandle: "user123",
      snipId: "qy5y42w4y45yuy3543tgy",
      body: "wow amazing, just not really ye",
      createdAt: "2020-04-15T11:46:01.018Z",
    },
  ],
  notifications: [
    {
      recipient: "user",
      sender: "tony",
      read: "true | false",
      snipId: "t23t4bv13bvt334345tbqtvb3434vtc234",
      type: "like | comment",
      createdAt: "2020-04-15T11:46:01.018Z",
    },
  ],
};
const userInformation = {
  // Date for redux
  credentials: {
    userId: "v25tyunw456b6wert34qn6qnb623223v523rv",
    email: "user123@email.com",
    userName: "user123",
    createdAt: "2020-04-15T11:46:01.018Z",
    imageUrl: "image/1235623525241375",
    bio: "My name is user123",
    website: "https://user123.com",
    location: "Space, Mars",
  },
  likes: [
    {
      userHandle: "user123",
      snipId: "234rvb3q34tgv34tgq3b",
    },
    {
      userHandle: "user123",
      snipId: "q34tbv34qtbv3qb344t4",
    },
  ],
};
