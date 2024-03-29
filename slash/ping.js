exports.run = async (client, interaction) => { // eslint-disable-line no-unused-vars
  await interaction.deferReply();
  const reply = await interaction.editReply("Ping?");
  await interaction.editReply(`Pong! Latency is ${reply.createdTimestamp - interaction.createdTimestamp}ms. API Latency is ${Math.round(client.ws.ping)}ms.`);
};

exports.commandData = {
  name: "ping",
  description: "Pongs when pinged.",
  options: [],
  defaultPermission: true,
};

exports.conf = {
  permLevel: "Administrator",
  guildOnly: true
};