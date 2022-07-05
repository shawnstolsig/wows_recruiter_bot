const Logger = require('../modules/logger')
const {
    ignoredChannels,
    recruits,
    feedbackQueue,
    recruitActivityPosts,
    questions,
    recentFeedback
} = require('../modules/enmaps')
const {
    MessageActionRow,
    MessageButton, MessageSelectMenu
} = require("discord.js")
const { bold } = require('../modules/functions')

module.exports = async (client, oldState, newState) => {
    const oldChannel = isIgnored(oldState.channel)
    const newChannel = isIgnored(newState.channel)
    const { member: { displayName: memberName, id: memberId } } = oldState
    const recruiterRole = await oldState.guild.roles.fetch(process.env.RECRUITER_ROLE_ID)
    const potentialRecruit = recruits.get(memberId)
    const isRecruit = potentialRecruit?.dateAdded && !potentialRecruit?.dateCompleted
    const isRecruiter = oldState.member.roles.cache.has(recruiterRole.id)

    // user disconnects from voice
    if (oldChannel && !newChannel){

        if(isRecruit){
            const currentVoiceSessionCount = recruits.get(memberId, 'voiceSessions')
            recruits.set(memberId, currentVoiceSessionCount + 1, 'voiceSessions')
            const activityPost = recruitActivityPosts.get(memberId)
            if(activityPost) {
                const recruitingChannel = oldChannel.guild.channels.cache.get(process.env.RECRUITING_CHANNEL)
                const message = await recruitingChannel.messages.fetch(activityPost)
                recruitActivityPosts.delete(memberId)
                message.delete();
            }
        }

        else if (isRecruiter){
            // look to see what feedback is owed
            const requestedFeedback = feedbackQueue.get(memberId)
            if(!requestedFeedback || !requestedFeedback.length) {
                return;
            }
            // iterate through each requested feedback
            const recent = recentFeedback.get(memberId) || []
            requestedFeedback.forEach(request => {

                // if not connected to recruit for long enough, exempt feedback session
                let timeConnectMin = (new Date() - new Date(request.startTime)) / (60 * 1000)
                if(timeConnectMin < client.container.constants.MIN_VOICE_CONNECTION_TIME){
                    Logger.log(`[feedback-exempt] ${memberName} wasn't connected with ${request.recruitName} for long enough for feedback: ${Math.round(timeConnectMin)} mins`)
                    return
                }

                // todo: uncomment this block when happy with feedback requst process
                // // if recruiter has already provided recent feedback for this recruit, exempt
                // else if (recent.find(feedback => feedback.recruitId === request.recruitId)){
                //     Logger.log(`[feedback-exempt] ${memberName} has recent feedback with ${request.recruitName} `)
                //     return
                // }

                const cancelButton = new MessageButton()
                  .setCustomId(`cancelFeedback-${request.recruitId}`)
                  .setLabel('Cancel')
                  .setStyle('SECONDARY')
                const startButton = new MessageButton()
                  .setCustomId(`startFeedback-${request.recruitId}`)
                  .setLabel('Start')
                  .setStyle('PRIMARY')
                const row = new MessageActionRow()
                  .addComponents(cancelButton)
                  .addComponents(startButton);
                oldState.member.send({
                    content: `Would you like to leave feedback for recruit ${bold(request.recruitName)}?`,
                    components: [row]
                })

            })
            // todo: uncomment delete feedback after testing
            // feedbackQueue.delete(memberId)
        }
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
                        { recruitId: memberId, recruitName: memberName, startTime: new Date() },
                        ...queue
                    ])
                }
            })

            if(!oldChannel){
                const recruitingChannel = newChannel.guild.channels.cache.get(process.env.RECRUITING_CHANNEL)
                const activityMessage = await recruitingChannel.send(`${bold(memberName)} is currently connected to a voice channel!`)
                recruitActivityPosts.set(memberId,activityMessage.id)
            }
        }

        else if (isRecruiter){
            const storedRecruits = Array.from(recruits.values()).filter(r => !r.dateCompleted).map(r => r.id)
            const recruitsInChannel = newChannel.members.filter(m => storedRecruits.includes(m.id))
            recruitsInChannel.forEach(recruit => {
                const queue = feedbackQueue.get(memberId) || []
                if(!queue.find(feedback => feedback.recruitId === recruit.id)){
                    feedbackQueue.set(memberId,[
                        { recruitId: recruit.id, recruitName: recruit.displayName, startTime: new Date() },
                        ...queue
                    ])
                }
            })
        }
    }
    // Other voice state changes (ignored channels, muten/deafen, etc)
    else {
        // do nothing, yet
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
