const Discord = require('discord.js')

const {
    getFeedback,
} = require('./messageFunctions')

/**
 * This function returns if the user is a recruit or a recruiter
 */
exports.checkForRecruitOrRecruiter = (client, user, recruiterRole, existingRecruits) => {
    return new Promise(resolve => {

        // FIRST: check to see if the user is a recruiter
        if (recruiterRole.members.has(user)) {
            resolve({ isRecruiter: true })
        }
        // SECOND: check to see if the user is an active recruit
        else if (user in existingRecruits && !existingRecruits[user].dateCompleted) {
            resolve({
                isRecruit: true,
                id: existingRecruits[user].id,
                row: existingRecruits[user].row,
                name: existingRecruits[user].name,
                startDate: existingRecruits[user].startDate,
                sessionCount: existingRecruits[user].voiceSessionCount,
            })
        }
        // if not a recruiter or recruit, resolve as false
        else {
            resolve(false)
        }
    })
}

/**
 * A function that updates a recruit's voice session count
 **/
var updateSessionCount = exports.updateSessionCount = (client, row, previousCount) => {

    // if previousCount is null, then recruit has never had a voice session, so set to 1.  otherwise, increment
    let newCount = previousCount ? parseInt(previousCount) + 1 : 1

    // get the cell
    let cell = client.recruitSheet.getCell(row, 4)
    cell.value = newCount
    client.recruitSheet.saveUpdatedCells()
}

/**
 * A function for adding to feedback queue. Handles if new entry is made, or if something's pushed to existing
 * array.
 */
var addFeedbackToQueue = exports.addFeedbackToQueue = (client, allFeedback, recruit, recruiter) => {

    // check to see if the recruiter has already input for recruit feedback on this day
    let sameDayFeedbackNotProvided = true
    let dateToCheck = new Date()
    dateToCheck = dateToCheck.toLocaleDateString()

    // for each recorded feedback
    allFeedback.forEach((feedback) => {
        // if date matches today, recruit IDs match, and recruiter IDs match
        if (feedback[4] === dateToCheck && feedback[1] === recruit && feedback[3] === recruiter) {
            // set flag to false
            client.logger.log(`${feedback[2]} has already provided same-day feedback for ${feedback[0]}.`)
            sameDayFeedbackNotProvided = false
        }
    })

    // only add feedback request to queue if same day feedback not already provided
    if (sameDayFeedbackNotProvided) {
        // check to see if the user already owes other feedback
        if (client.feedbackQueue[recruiter]) {

            // only add more feedback if there isn't currently feedback required for this recruit
            if (!client.feedbackQueue[recruiter].includes(recruit)) {
                // if recruiter does, add feedback for the recruit who just left the channel
                client.feedbackQueue[recruiter].push(recruit)
            }

        } else {
            // if recruiter does not, then add new entry to feedbackQueue
            client.feedbackQueue[recruiter] = [recruit]
        }
    }
}

/**
 * Returns an object containing all of the remaining recruits, provided all remaining users and the 
 * exisitng recruits from google sheets
 */
exports.getRemainingRecruits = (allRemainingUsers, existingRecruits) => {
    let remainingRecruits = {}
    allRemainingUsers.forEach((user) => {
        if (existingRecruits[user.id]) {
            remainingRecruits[user.id] = existingRecruits[user.id]
        }
    })
    return remainingRecruits
}

/**
 * Returns an object containing all of the remaining recruiters, provided all remaining users and the 
 * exisitng recruits from google sheets
 */
exports.getRemainingRecruiters = (allRemainingUsers, recruiterRole) => {
    let remainingRecruiters = {}
    allRemainingUsers.forEach((user) => {
        if (recruiterRole.members.has(user.id)) {
            remainingRecruiters[user.id] = { name: user.displayName }
        }
    })
    return remainingRecruiters
}

/**
 * When a user disconnects from voice, check to see if their role, take action appropriately
 * if they are a recruit or recruiter.   
 */
exports.handleUserDisconnectFromVoice = (client, thisUserRole, remainingRecruits, remainingRecruiters, allFeedback, oldState) => {
    // if the user who disconnected is a recruit
    if (thisUserRole.isRecruit) {

        // get recruit status details
        const { row, sessionCount } = thisUserRole

        // update the recruits session count
        updateSessionCount(client, row, sessionCount)

        // delete the message from the bot's text channel that announced when they joined voice
        client.recruitInVoiceMessages[thisUserRole.id].delete()

        // remove the recruit's key from the object tracking this message
        delete client.recruitInVoiceMessages[thisUserRole.id]

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
        for (const recruiterID in client.feedbackQueue) {

            // if the user who disconnects is the recruiter owing feedback
            if (recruiterID == oldState.id) {
                // handle feedback
                getFeedback(client, oldState.guild, recruiterID, client.feedbackQueue[recruiterID])
            }
        }
    }
}

/**
 * Posts a message in the recruiter text channel whenever a recruiter is online.  Stores this msg
 * on the client object so it can be edited later.
 */
// this function posts a message in the recruiter text channel when a recruit is online
exports.handleUserConnectToVoice = async (client, thisUserRole, guild) => {

    // check to see if user is a recruit
    if (thisUserRole.isRecruit) {

        // get the bot's text channel
        let channel = await guild.channels.cache.get(client.botChannelId)

        // Use the MessageEmbed to make a more noticable message
        // inside a command, event listener, etc.
        // const embedMessage = new Discord.MessageEmbed()
        //     .setColor('#0099ff')
        //     .setTitle(`${thisUserRole.name}`)
        //     .setDescription(`...is currently in a voice channel.  Drop in and say hello!`)

        // send message to the channel (PERMISSION ISSUE WITH EMBEDS)
        // let msg = await channel.send(embedMessage)

        // send message to the channel
        let msg = await channel.send(`> **----  ${thisUserRole.name} is currently in a voice channel.  -----**`)

        // store the message in the client object, using the recruiter's id as the key
        client.recruitInVoiceMessages[thisUserRole.id] = msg

    }
}