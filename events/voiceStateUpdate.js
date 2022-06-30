const Logger = require('../modules/logger')
const { ignoredChannels } = require('../modules/enmaps')

module.exports = async (client, oldState, newState) => {
    const oldChannel = isIgnored(oldState.channel)
    const newChannel = isIgnored(newState.channel)
    const memberName = oldState.member.displayName

    // user joins channel
    if(!oldChannel && newChannel){
        Logger.log(`${memberName} joined ${newChannel.name}`)
    }
    // user leaves chanel
    else if (oldChannel && !newChannel){
        Logger.log(`${memberName} disconnected from ${oldChannel.name}`)
    }
    // user switches channel
    else if (newChannel !== oldChannel){
        Logger.log(`${memberName} switched from ${oldChannel.name} -> ${newChannel.name}`)
    }
    else {
        Logger.log( `Other voice state change: ${memberName}: ${oldState?.channel?.name} -> ${newState?.channel?.name}`)
    }
};

/**
 * Determines if channels should be treated like an ignored channel
 * @param channel
 * @returns {null|{parent}|*}
 */
function isIgnored(channel){
    // if input isn't a channel (true when not switching voice channels), just return the null input
    if(!channel) return null;
    // if channel has a parent and that parent is ignored, treat as ignored
    if(channel.parent && ignoredChannels.get(channel.parent.id) || ignoredChannels.get(channel.id)) return null;
    // if channel itself is ignored, then treat it as ignored
    if(ignoredChannels.get(channel.id)) return null;

    // if all above tests pass, then return the original channel
    return channel;
}