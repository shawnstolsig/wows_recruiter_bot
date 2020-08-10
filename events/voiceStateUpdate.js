module.exports = async (client, oldState, newState) => {
    let oldChannel = oldState.channel
    let newChannel = newState.channel
    let remainingUsers
    if (oldChannel) {
        remainingUsers = oldChannel.members.array()   // this should be an array, but is leaving something like <@235088799074484224>
    }

    // When user joins voice, from no voice at all
    if (newChannel && oldChannel === null) {
        client.logger.log(`${oldState.id} joined voice channel. Joined channel ${newChannel}`)
    }
    // When user switches voice channel
    else if (newChannel && oldChannel != newChannel) {
        client.logger.log(`${oldState.id} switched voice channels.  Left ${oldChannel}`)
        client.logger.log(`Users remaining in voice channel: ${remainingUsers}`)
    }
    // When user disconnects from voice altogether
    else if (newChannel === null) {
        client.logger.log(`${oldState.id} left voice channel ${oldChannel}`)
        client.logger.log(`Users remaining in voice channel: ${remainingUsers}`)

        // check to see if user that left is a recruit
        let recruitStatus = await checkForRecruit(client, oldState.member.id)

        // if the user is a recruit
        if (recruitStatus.isRecruit) {

            // get recruit status details
            const { index, sessionCount } = recruitStatus

            // update the recruits session count
            updateSessionCount(client, index, sessionCount)

            // iterate through all remaining users in the channel
            let recruiterRole = await oldState.guild.roles.fetch(client.recruiterRole)

            remainingUsers.forEach((user) => {

                // if remaining user is a recruiter
                if(recruiterRole.members.array().includes(user)){
                    
                    client.logger.log(`New feedback required, recruit just left recruiter.`)

                    // check to see if the user already owes other feedback
                    if(client.feedbackQueue[user.id]){

                        // should recruiter be required to give feedback if already done before?

                        // if recruiter does, add feedback for the recruit who just left the channel
                        client.feedbackQueue[user.id].push(oldState.member.id)
                    } else {
                        // if recruiter does not, then add new entry to feedbackQueue
                        client.feedbackQueue[user.id] = [oldState.member.id]
                    }

                } else {
                    // this remaining user is not a recruiter, take no action

                }

            })

            client.logger.log(`feedbackQueue is now ${JSON.stringify(client.feedbackQueue)}`)
                
                    // add them to the client.feedbackQueue.  include provider and recruit's id's
        } 

        // if the user is not a recruit
        else {
            // check to see if they are in the feedback-provider group
                // HANDLE FEEDBACK
        }



    }
};

/**
 * This function takes in an ID and get's that user's status as a recruit
 * Returns object with shape {isRecruit: bool, index: int, sessionCount: int}
 **/
function checkForRecruit(client, id) {

    return new Promise(resolve => {
        // get existing recruits
        client.sheet.spreadsheets.values.get({
            spreadsheetId: client.spreadsheetId,
            range: 'Recruits!A2:E'
        }, (err, result) => {
            // handle error
            if (err) {
                client.logger.log(`Unable to get recruits from Google Sheet: ` + err, 'error');
            }
            // handle the list of recruits
            else {
                let existingRecruits = []
                // check to make sure recruits were returned.  if recruits are empty, we can't call .map
                if (result.data.values) {
                    result.data.values.map((row) => existingRecruits.push(row[1]))
                }

                // if recruit is already on recruit list, update message
                let recruitIndex = existingRecruits.indexOf(id)
                if (recruitIndex !== -1) {
                    if (result.data.values[recruitIndex][3]) {
                        resolve({ isRecruit: false })
                    }
                    resolve({
                        isRecruit: true,
                        index: recruitIndex,
                        sessionCount: result.data.values[recruitIndex][4]
                    })
                }

                // if recruit is not on list
                else {
                    resolve({ isRecruit: false })
                }
            }
        })
    })
}

/**
 * A function that updates a recruit's voice session count
 **/ 
function updateSessionCount(client, index, previousCount) {

    // if previousCount is null, then recruit has never had a voice session, so set to 1.  otherwise, increment
    let values = [previousCount ? [parseInt(previousCount) + 1] : [1]]
    
    let resource = {
        values,
    };

    // append new recruit to google sheet
    client.sheet.spreadsheets.values.update({
        spreadsheetId: client.spreadsheetId,
        range: `Recruits!E${index + 2}`,
        valueInputOption: 'USER_ENTERED',
        resource,
    }, (err, result) => {
        // handle errors
        if (err) {
            client.logger.log(`Unable to update recruit's voice session count.  ` + err, 'error');
        }
    });

}