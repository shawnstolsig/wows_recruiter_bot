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
  const msg = await message.channel.send("Getting individual stats...");

  // calculate uptime
  let totalSeconds = (client.uptime / 1000);
  let days = Math.floor(totalSeconds / 86400);
  totalSeconds %= 86400;
  let hours = Math.floor(totalSeconds / 3600);
  totalSeconds %= 3600;
  let minutes = Math.floor(totalSeconds / 60);

  // get the user's id
  let recruiterID = message.author.id

  // declare message string for later use
  let msgString = `>>> __** Individual Feedback Report **__\n`
  msgString += `Below are the current feedback stats, since the bot server's last reset.\n`
  msgString += `Current bot uptime: ${days} days, ${hours} hours, and ${minutes} minutes\n`

  // check to see if bot has requested feedback for this user yet
  if (client.feedback[recruiterID]) {
    // get total values
    let { name, success, skipped, timedOut, total } = client.feedback[recruiterID]
    let successRate = getSuccessRate(success, total)
    msgString += `**${name}** - Success Rate: ${successRate}\tSuccessful: ${success}\tManually Skipped: ${skipped}\tTimed Out: ${timedOut}\tTotal: ${total}`
  }
  else {
    msgString += `(Bot has not requested feedback for yet)`
  }

  msg.edit(msgString)

  // const statsEmbed = new Discord.MessageEmbed()
  //   .setColor('#f54242')
  //   .setTitle(`Individual Feedback Report`)
  //   if (client.feedback.totals[recruiterID]) {
  //     // get total values
  //     let { name, success, skipped, timedOut, total } = client.feedback.totals[recruiterID]
  //     let successRate = getSuccessRate(success, total)

  //     statsEmbed.addField(`${name}'s stats:`, ` -- Success Rate: ${successRate} -- \nSuccessful: ${success}\nManually Skipped: ${skipped}\nTimed Out: ${timedOut}\nTotal: ${total}`)
  //   }
  //   else {
  //     statsEmbed.addField('Individual stats:', '(Bot has not yet requested feedback from this recruiter yet.)')
  //   }

  // msg.edit(statsEmbed);
};

exports.conf = {
  enabled: true,
  guildOnly: false,
  aliases: [],
  permLevel: "User"
};

exports.help = {
  name: "stats",
  category: "Recruiting",
  description: "Provides some stats on response rate from a recruiter during current uptime.",
  usage: "stats"
};

function getSuccessRate(success, total) {
  return ((success / total) * 100).toFixed(2) + '%'
}