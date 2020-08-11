exports.run = async (client, message, args, level) => { // eslint-disable-line no-unused-vars
    const msg = await message.channel.send("Showing feedback queue....");
    msg.edit(JSON.stringify(client.feedbackQueue));
  };
  
  exports.conf = {
    enabled: true,
    guildOnly: false,
    aliases: [],
    permLevel: "Bot Owner"
  };
  
  exports.help = {
    name: "show_queue",
    category: "Dev",
    description: "Shows the feedback queue, for dev purposes.",
    usage: "show_queue"
  };
  