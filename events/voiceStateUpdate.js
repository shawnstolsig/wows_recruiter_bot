const {
    checkForRecruitOrRecruiter,
    updateSessionCount,
    addFeedbackToQueue,
    getRemainingRecruits,
    getRemainingRecruiters,
    handleUserDisconnectFromVoice,
    handleUserConnectToVoice,
} = require('../modules/voiceFunctions')

const {
    getFeedback,
} = require('../modules/messageFunctions')

const {
    getCurrentRecruits,
    getAllFeedback
} = require('../modules/sheetsFunctions')

module.exports = async (client, oldState, newState) => {
    try {
        // voiceStateUpdate is passed in the state before user changes voice, and the state after user changes voice
        let oldChannel = oldState.channel
        let newChannel = newState.channel

        // get the guild recruiter role for later use
        let recruiterRole = await oldState.guild.roles.fetch(client.recruiterRole)

        // get object of all existing recruits.  {id: {sessionCount, startDate, name}} for each active recruit
        let existingRecruits = await getCurrentRecruits(client)

        // get all feedback, which will later be used to filter if new feedback should be added based on time
        let allFeedback = await getAllFeedback(client)

        // figure out if the user that changed voice states is a recruit or a recruiter
        let thisUserRole = await checkForRecruitOrRecruiter(client, oldState.id, recruiterRole, existingRecruits)

        // get the recruits and recruiters who remain in the previous channel (if this is not someone joining voice for first time)
        let remainingRecruits
        let remainingRecruiters
        if (oldChannel) {
            let remainingUsers = oldChannel.members.array()
            // remaining recruits:
            remainingRecruits = getRemainingRecruits(remainingUsers, existingRecruits)

            // remaining recruiters:
            remainingRecruiters = getRemainingRecruiters(remainingUsers, recruiterRole)
        }

        // if enmap.get is undefined, then channel is active
        // if enmap.get is truthy value, then channel is inactive

        // When user joins voice, from no voice at all
        if (newChannel && oldChannel === null) {

            // only take action if joining a non-ignored channel
            if (client.ignoredChannels.get(newChannel.id) === undefined) {
                // invoke function for user connecting to voice
                handleUserConnectToVoice(client, thisUserRole, newState.guild)
            }
        }
        // When user switches voice channel
        else if (newChannel && oldChannel != newChannel) {


            // check to see if user is coming from an ignored channel.
            if (client.ignoredChannels.get(oldChannel.id)) {
                // treat as if user is joining from no voice
                handleUserConnectToVoice(client, thisUserRole, newState.guild)
            }

            // check to see if user is going to ignored channel
            else if (client.ignoredChannels.get(newChannel.id)) {
                // treat as if user had disconnected
                handleUserDisconnectFromVoice(client, thisUserRole, remainingRecruits, remainingRecruiters, allFeedback, oldState)
            }

            // if user is not coming from AFK channel
            else {
                // if the user who disconnected is a recruit
                if (thisUserRole.isRecruit) {
                    // add feedback for each remaining recruiter
                    for (const recruiter in remainingRecruiters) {
                        addFeedbackToQueue(client, allFeedback, oldState.id, recruiter)
                    }
                }

                // if the user who disconnected is a recruiter
                else if (thisUserRole.isRecruiter) {

                    // add feedback for each remaining recruit
                    for (const recruit in remainingRecruits) {
                        addFeedbackToQueue(client, allFeedback, recruit, oldState.id)
                    }
                }
            }
        }
        // When user disconnects from voice altogether
        else if (newChannel === null) {


            // invoke handleUserDisconnetFromVoice if disconnecting from non-ignored channel.  feedback will be collected when user moves to ignored channel
            if(client.ignoredChannels.get(oldChannel.id) === undefined){
                handleUserDisconnectFromVoice(client, thisUserRole, remainingRecruits, remainingRecruiters, allFeedback, oldState)
            }

        }

    } catch (e) {
        client.logger.log(`Error handling voice status update: ` + e, 'error')
        console.log("member",oldState.member.displayName, "old channel",oldState.channel.name, "new channel", newState.channel.name)
    }
};



