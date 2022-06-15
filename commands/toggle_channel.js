exports.run = async (client, message, args, level) => { // eslint-disable-line no-unused-vars
    const msg = await message.channel.send("Toggling if the recruiter bot ignores this voice channel....");

    // validate input
    if(args.length > 1){
        msg.edit(`Please input a single channel id.`)
    } 
    else if (args.length === 0){

        msg.edit(`The following channels are currently ignored: ${client.ignoredChannels.array().length === 0 ? '(none)' : client.ignoredChannels.array()}`)
    }
    // if valid channel id
    else {

        try {
            let channel = message.guild.channels.cache.get(args[0])

            if (!!channel){

                // if the channel can't be found in Enmap, add to start ignoring
                if(!client.ignoredChannels.get(channel.id)){
                    client.ignoredChannels.set(channel.id, channel.name)
                    msg.edit(`The bot is now ignoring the ${channel.name} voice channel.`)
                }
                // if the channel is already being ignored, remove from Enmap to reactivate
                else {
                    client.ignoredChannels.delete(channel.id)
                    msg.edit(`The bot has removed ${channel.name} from the ignored voice channel list.`)
                }

            } else {
                msg.edit(`Could not find voice channel.`)
            }


        } catch (e) {
            client.logger.log("Error while fetching channel to toggle:" + e, 'error')
        }


    }

  };
  
  exports.conf = {
    enabled: true,
    guildOnly: false,
    aliases: [],
    permLevel: "Bot Owner"
  };
  
  exports.help = {
    name: "toggle_channel",
    category: "System",
    description: "Toggles whether or not the bot ignores this voice channel.",
    usage: "toggle_channel <channel id>"
  };
  