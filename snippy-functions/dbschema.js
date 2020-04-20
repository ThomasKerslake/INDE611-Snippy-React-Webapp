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
      userHandle: "userName",
      body: "this is some body of text",
      createdAt: "2020-04-15T11:46:01.018Z",
      numOfLikes: 7,
      numOfComments: 3,
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
