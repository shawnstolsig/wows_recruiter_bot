const Logger = require('../modules/logger')
const { ignoredChannels, recruits } = require('../modules/enmaps')

module.exports = async (client, oldState, newState) => {
    const oldChannel = isIgnored(oldState.channel)
    const newChannel = isIgnored(newState.channel)
    const memberName = oldState.member.displayName
    const recruiterRole = await oldState.guild.roles.fetch(process.env.RECRUITER_ROLE_ID)
    const potentialRecruit = recruits.get(oldState.member.id)
    const isRecruit = potentialRecruit?.dateAdded && !potentialRecruit?.dateCompleted
    const isRecruiter = oldState.member.roles.cache.has(recruiterRole.id)

    // user joins channel
    if(!oldChannel && newChannel){
        Logger.log(`${memberName} ${isRecruit ? "(recruit)" : ''} ${isRecruiter ? "(RECRUITER)" : ''} joined ${newChannel.name}`)
    }
    // user leaves chanel
    else if (oldChannel && !newChannel){
        Logger.log(`${memberName} ${isRecruit ? "(recruit)" : ''} ${isRecruiter ? "(RECRUITER)" : ''} disconnected from ${oldChannel.name}`)
    }
    // user switches channel
    else if (newChannel !== oldChannel){
        Logger.log(`${memberName} ${isRecruit ? "(recruit)" : ''} ${isRecruiter ? "(RECRUITER)" : ''} switched from ${oldChannel.name} -> ${newChannel.name}`)
    }
    else {
        Logger.log( `Other voice state change: ${memberName} ${isRecruit ? "(recruit)" : ''} ${isRecruiter ? "(RECRUITER)" : ''}: ${oldState?.channel?.name} -> ${newState?.channel?.name}`)
    }
};

/**
 * DM Sequence
 */
function gatherRecruitFeedback(){

}


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