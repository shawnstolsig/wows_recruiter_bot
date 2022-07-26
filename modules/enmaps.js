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
  recruitActivityPosts: new Enmap({
    name: "recruitActivityPosts",
  }),
  questions: new Enmap({
    name: "questions",
  }),
  recentFeedback: new Enmap({
    name: "recentFeedback",
  }),
};