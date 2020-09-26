const Discord = require('discord.js');

exports.run = async (client, message, args, level) => { // eslint-disable-line no-unused-vars
  const msg = await message.channel.send("Getting overall stats...");

  // calculate uptime
  let totalSeconds = (client.uptime / 1000);
  let days = Math.floor(totalSeconds / 86400);
  totalSeconds %= 86400;
  let hours = Math.floor(totalSeconds / 3600);
  totalSeconds %= 3600;
  let minutes = Math.floor(totalSeconds / 60);

  // get total values
  let { success, skipped, timedOut, total } = client.feedback.totals
  let successRate = getSuccessRate(success, total)

  // Create string for message
  let msgString = `>>> __** Overall Feedback Report **__\n`
  msgString += `Below are the current feedback stats, since the bot server's last reset.\n`
  msgString += `Current bot uptime: ${days} days, ${hours} hours, and ${minutes} minutes\n`
  msgString += `**Overall** - Success Rate: ${successRate}\tSuccessful: ${success}\tManually Skipped: ${skipped}\tTimed Out: ${timedOut}\tTotal: ${total}\n`
  
  // loop through all recruiters
  for (let recruiter in client.feedback) {
    if (recruiter !== 'totals') {
      let { name, success, skipped, timedOut, total } = client.feedback[recruiter]
      let successRate = getSuccessRate(success, total)
      msgString += `**${name}** - Success Rate: ${successRate}\tSuccessful: ${success}\tManually Skipped: ${skipped}\tTimed Out: ${timedOut}\tTotal: ${total}\n`
    }
  }

  msg.edit(msgString)
  // const statsEmbed = new Discord.MessageEmbed()
  //   .setColor('#f54242')
  //   .setTitle('Overall Feedback Report')
  //   .setDescription("Below are the current feedback stats, since the bot server's last reset.")
  //   .addFields(
  //     { name: 'Current bot uptime:', value: `${days} days, ${hours} hours, and ${minutes} minutes` },
  //     { name: '\u200B', value: '\u200B' },
  //     { name: 'Overall Stats', value: ` -- Success Rate: ${successRate} -- \nSuccessful: ${success}\nManually Skipped: ${skipped}\nTimed Out: ${timedOut}\nTotal: ${total}`},
  //     { name: '\u200B', value: '\u200B' },
  //   )

  //   // loop through all recruiters
  //   for (let recruiter in client.feedback){
  //     if (recruiter !== 'totals'){
  //       let {name, success, skipped, timedOut, total } = client.feedback[recruiter]
  //       let successRate = getSuccessRate(success, total)
  //       statsEmbed.addField(`${name}`, ` -- Success Rate: ${successRate} -- \nSuccessful: ${success}\nManually Skipped: ${skipped}\nTimed Out: ${timedOut}\nTotal: ${total}`)
  //     }
  //   }

  // msg.edit(statsEmbed);
};

exports.conf = {
  enabled: true,
  guildOnly: false,
  aliases: [],
  permLevel: "Bot Admin"
};

exports.help = {
  name: "overall_stats",
  category: "Recruiting",
  description: "Provides some stats on response rate from recruiters during current uptime.",
  usage: "overall_stats"
};

function getSuccessRate(success, total) {
  return ((success / total) * 100).toFixed(2) + '%'
}