const Logger = require('../modules/logger')
const { ignoredChannels } = require('../modules/enmaps')

module.exports = async (client, oldState, newState) => {
    const oldChannel = isIgnored(oldState.channel)
    const newChannel = isIgnored(newState.channel)
    const member = oldState.member

    // user joins channel
    if(!oldChannel && newChannel){
        Logger.log(`${member.displayName} joined ${newChannel.name}`)
    }
    // user leaves chanel
    else if (oldChannel && !newChannel){
        Logger.log(`${member.displayName} disconnected from ${oldChannel.name}`)
    }
    // user switches channel
    else if (newChannel !== oldChannel){
        Logger.log(`${member.displayName} switched from ${oldChannel.name} -> ${newChannel.name}`)
    }
    else {
        Logger.log( `Other voice state change: ${oldState?.member?.displayName}: ${oldState?.channel?.name} -> ${newState?.channel?.name}`)
    }
};

function isIgnored(channel){
    if(!channel) return channel;
    if(channel.parent && ignoredChannels.get(channel.parent.id) || ignoredChannels.get(channel.id)) return null;
    if(ignoredChannels.get(channel.id)) return null;

    return channel;
}