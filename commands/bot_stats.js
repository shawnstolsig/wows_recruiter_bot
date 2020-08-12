exports.run = async (client, message, args, level) => { // eslint-disable-line no-unused-vars
    const msg = await message.channel.send("Getting bot stats...");
    
    msg.edit(`Feedback stats during current uptime:\nSuccess rate: ${(1-((client.feedback.skipped + client.feedback.timedOut)/client.feedback.total))*100}% \n Total feedback requests: ${client.feedback.total}\n Manually skipped/cancelled feedbacks: ${client.feedback.skipped}\n Timed out feedbacks: ${client.feedback.timedOut}`);
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
  