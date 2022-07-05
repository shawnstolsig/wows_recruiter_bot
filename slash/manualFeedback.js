exports.run = async (client, interaction) => { // eslint-disable-line no-unused-vars
  // don't think anything's needed here since this is a Context Menu command
};

exports.commandData = {
  name: "feedback",
  options: [],
  defaultPermission: true,
  type: "USER"
};

// TODO: set guildOnly to true for this command
exports.conf = {
  permLevel: "User",
  guildOnly: false
};