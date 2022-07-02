const Logger = require('../modules/logger')
const {
    ignoredChannels,
    recruits,
    feedbackQueue,
    recruiterActivityPosts,
    questions } = require('../modules/enmaps')

module.exports = async (client, oldState, newState) => {
    const oldChannel = isIgnored(oldState.channel)
    const newChannel = isIgnored(newState.channel)
    const { member: { displayName: memberName, id: memberId } } = oldState
    const recruiterRole = await oldState.guild.roles.fetch(process.env.RECRUITER_ROLE_ID)
    const potentialRecruit = recruits.get(memberId)
    const isRecruit = potentialRecruit?.dateAdded && !potentialRecruit?.dateCompleted
    const isRecruiter = oldState.member.roles.cache.has(recruiterRole.id)

    // todo: delete log statements for voice updates

    // user disconnects from voice
    if (oldChannel && !newChannel){

        if(isRecruit){
            const currentVoiceSessionCount = recruits.get(memberId, 'voiceSessions')
            recruits.set(memberId, currentVoiceSessionCount + 1, 'voiceSessions')
        }

        else if (isRecruiter){
            //todo: DM sequence
        }

        Logger.log(`${memberName} ${isRecruit ? "(recruit)" : ''} ${isRecruiter ? "(RECRUITER)" : ''} disconnected from ${oldChannel.name}`)
    }
    // user joins or switches channel
    else if((!oldChannel && newChannel) || (newChannel !== oldChannel)){
        if(!newChannel.members) return;

        if(isRecruit){
            const recruitersInChannel = newChannel.members.filter(m => m.roles.cache.has(recruiterRole.id))
            recruitersInChannel.forEach(recruiter => {
                const queue = feedbackQueue.get(recruiter.id) || []
                if(!queue.find(feedback => feedback.recruitId === memberId)){
                    feedbackQueue.set(recruiter.id,[
                        { recruitId: memberId, startTime: new Date() },
                        ...queue
                    ])
                }
            })
        }

        else if (isRecruiter){
            const storedRecruits = Array.from(recruits.values()).filter(r => !r.dateCompleted).map(r => r.id)
            const recruitsInChannel = newChannel.members.filter(m => storedRecruits.includes(m.id))
            recruitsInChannel.forEach(recruit => {
                const queue = feedbackQueue.get(memberId) || []
                if(!queue.find(feedback => feedback.recruitId === recruit.id)){
                    feedbackQueue.set(memberId,[
                        { recruitId: recruit.id, startTime: new Date() },
                        ...queue
                    ])
                }
            })
        }

        Logger.log(`${memberName} ${isRecruit ? "(recruit)" : ''} ${isRecruiter ? "(RECRUITER)" : ''} joined ${newChannel.name}`)
    }

    // // user switches channel
    // else if (newChannel !== oldChannel){
    //     Logger.log(`${memberName} ${isRecruit ? "(recruit)" : ''} ${isRecruiter ? "(RECRUITER)" : ''} switched from ${oldChannel.name} -> ${newChannel.name}`)
    // }
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


function getRecruitsInChannel(){

}