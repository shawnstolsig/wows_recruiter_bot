const { 
    checkForRecruitOrRecruiter,
    updateSessionCount,
    addFeedbackToQueue,
    getRemainingRecruits,
    getRemainingRecruiters,
} = require('../modules/voiceFunctions')

const {
    getFeedback,
} = require('../modules/messageFunctions')

const { 
    getCurrentRecruits,
    getAllFeedback
 } = require('../modules/sheetsFunctions')

module.exports = async (client, oldState, newState) => {
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


    // When user joins voice, from no voice at all
    if (newChannel && oldChannel === null) {
        // No action taken
    }
    // When user switches voice channel
    else if (newChannel && oldChannel != newChannel) {

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
    // When user disconnects from voice altogether
    else if (newChannel === null) {

        // if the user who disconnected is a recruit
        if (thisUserRole.isRecruit) {

            // get recruit status details
            const { row, sessionCount } = thisUserRole

            // update the recruits session count
            updateSessionCount(client, row, sessionCount)                    

            // add feedback for each remaining recruiter
            for (const recruiter in remainingRecruiters) {
                addFeedbackToQueue(client, allFeedback, oldState.id, recruiter)
            }
        }

        // if the user who disconnected is a recruiter
        else if (thisUserRole.isRecruiter) {

            // first, add feedback for any remaining recruits
            for (const recruit in remainingRecruits) {
                addFeedbackToQueue(client, allFeedback, recruit, oldState.id)
            }

            // iterate through outstanding feedbacks.  the keys are recruiter IDs
            for(const recruiterID in client.feedbackQueue){

                // if the user who disconnects is the recruiter owing feedback
                if(recruiterID == oldState.id){
                    // handle feedback
                    getFeedback(client, oldState.guild, recruiterID, client.feedbackQueue[recruiterID])
                }
            }
        }
    }
};
