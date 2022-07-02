const Enmap = require("enmap");

module.exports = {
  settings: new Enmap({
    name: "settings",
  }),
  ignoredChannels: new Enmap({
    name: "ignoredChannels",
  }),
  recruits: new Enmap({
    name: "recruits",
  }),
  feedbackQueue: new Enmap({
    name: "feedbackQueue",
  }),
  recruiterActivityPosts: new Enmap({
    name: "recruiterActivityPosts",
  }),
  questions: new Enmap({
    name: "questions",
  }),
};