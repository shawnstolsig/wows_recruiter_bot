// const { version } = require("discord.js");
// const moment = require("moment");
// require("moment-duration-format");

// exports.run = (client, message, args, level) => { // eslint-disable-line no-unused-vars
//   const duration = moment.duration(client.uptime).format(" D [days], H [hrs], m [mins], s [secs]");
//   message.channel.send(`= STATISTICS =
// • Mem Usage  :: ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB
// • Uptime     :: ${duration}
// • Users      :: ${client.users.size.toLocaleString()}
// • Servers    :: ${client.guilds.size.toLocaleString()}
// • Channels   :: ${client.channels.size.toLocaleString()}
// • Discord.js :: v${version}
// • Node       :: ${process.version}`, {code: "asciidoc"});
// };

const Discord = require('discord.js');

exports.run = async (client, message, args, level) => { // eslint-disable-line no-unused-vars
  const msg = await message.channel.send("Getting bot stats...");

  // get the user's id
  let recruiterID = message.author.id

  const statsEmbed = new Discord.MessageEmbed()
    .setColor('#f54242')
    .setTitle(`Individual Feedback Report`)
    if (client.feedback.totals[recruiterID]) {
      // get total values
      let { name, success, skipped, timedOut, total } = client.feedback.totals[recruiterID]
      let successRate = getSuccessRate(success, total)

      statsEmbed.addField(`${name}'s stats:`, ` -- Success Rate: ${successRate} -- \nSuccessful: ${success}\nManually Skipped: ${skipped}\nTimed Out: ${timedOut}\nTotal: ${total}`)
    }
    else {
      statsEmbed.addField('Individual stats:', '(Bot has not yet requested feedback from this recruiter yet.)')
    }

  msg.edit(statsEmbed);
};

exports.conf = {
  enabled: true,
  guildOnly: false,
  aliases: [],
  permLevel: "User"
};

exports.help = {
  name: "stats",
  category: "Miscelaneous",
  description: "Gives some useful bot statistics",
  usage: "stats"
};
