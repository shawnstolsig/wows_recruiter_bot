exports.run = async (client, interaction) => { // eslint-disable-line no-unused-vars
  // don't think anything's needed here since this is a Context Menu command
};

exports.commandData = {
  name: "feedback",
  options: [],
  defaultPermission: true,
  type: "USER"
};

exports.conf = {
  permLevel: "User",
  guildOnly: true
};