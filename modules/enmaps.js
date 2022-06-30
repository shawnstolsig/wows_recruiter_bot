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
};