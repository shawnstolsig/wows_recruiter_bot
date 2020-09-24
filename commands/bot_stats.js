const Discord = require('discord.js');

exports.run = async (client, message, args, level) => { // eslint-disable-line no-unused-vars
  const msg = await message.channel.send("Getting bot stats...");

  // calculate uptime
  let totalSeconds = (client.uptime / 1000);
  let days = Math.floor(totalSeconds / 86400);
  totalSeconds %= 86400;
  let hours = Math.floor(totalSeconds / 3600);
  totalSeconds %= 3600;
  let minutes = Math.floor(totalSeconds / 60);

  // get total values
  let { success, skipped, timedOut, total} = client.feedback.totals
  let successRate = getSuccessRate(success, total)

  const statsEmbed = new Discord.MessageEmbed()
    .setColor('#f54242')
    .setTitle('Overall Feedback Report')
    .setDescription("Below are the current feedback stats, since the bot server's last reset.")
    .addFields(
      { name: 'Current bot uptime:', value: `${days} days, ${hours} hours, and ${minutes} minutes` },
      { name: '\u200B', value: '\u200B' },
      { name: 'Overall Stats', value: ` -- Success Rate: ${successRate} -- \nSuccessful: ${success}\nManually Skipped: ${skipped}\nTimed Out: ${timedOut}\nTotal: ${total}`},
      { name: '\u200B', value: '\u200B' },
    )

    // loop through all recruiters
    for (let recruiter in client.feedback){
      if (recruiter !== 'totals'){
        let {name, success, skipped, timedOut, total } = client.feedback[recruiter]
        let successRate = getSuccessRate(success, total)
        statsEmbed.addField(`${name}`, ` -- Success Rate: ${successRate} -- \nSuccessful: ${success}\nManually Skipped: ${skipped}\nTimed Out: ${timedOut}\nTotal: ${total}`)
      }
    }

  msg.edit(statsEmbed);
};

exports.conf = {
  enabled: true,
  guildOnly: false,
  aliases: [],
  permLevel: "Bot Owner"
};

exports.help = {
  name: "bot_stats",
  category: "Dev",
  description: "Provides some basic stats on response rate from recruiters during current uptime.",
  usage: "bot_stats"
};

function getSuccessRate(success, total){
  return ((success/total)*100).toFixed(2) + '%'
}