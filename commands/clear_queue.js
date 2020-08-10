exports.run = async (client, message, args, level) => { // eslint-disable-line no-unused-vars
    const msg = await message.channel.send("Clearing feedback queue....");
    client.feedbackQueue = {}
    msg.edit(`Feedback queue cleared.`);
    client.logger.log(`Feedback queue cleared: ${JSON.stringify(client.feedbackQueue)}`)
  };
  
  exports.conf = {
    enabled: true,
    guildOnly: false,
    aliases: [],
    permLevel: "Bot Owner"
  };
  
  exports.help = {
    name: "clear_queue",
    category: "Dev",
    description: "Clears the feedback queue, for dev purposes.",
    usage: "clear_queue"
  };
  