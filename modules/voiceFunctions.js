/**
 * This function returns if the user is a recruit or a recruiter
 */
exports.checkForRecruitOrRecruiter = (client, user, recruiterRole, existingRecruits) => {
    return new Promise(resolve => {

        // FIRST: check to see if the user is a recruiter
        if (recruiterRole.members.has(user)) {
            resolve({ isRecruiter: true })
        }
        // SECOND: check to see if the user is a recruit
        else if (user in existingRecruits) {
            resolve({
                isRecruit: true,
                index: existingRecruits[user].index,
                name: existingRecruits[user].name,
                startDate: existingRecruits[user].startDate,
                sessionCount: existingRecruits[user].sessionCount,
            })
        }
        // if not a recruiter or recruit, resolve as false
        else {
            resolve(false)
        }
    })
}

/**
 * This function takes in an ID and get's that user's status as a recruit
 **/
exports.getRecruits = (client) => {

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
                let existingRecruits = {}
                // check to make sure recruits were returned.  if recruits are empty, we can't call .map
                if (result.data.values) {
                    result.data.values.map((row, index) => {
                        // if no completed date
                        if (!row[3]) {
                            // add this recruit to the existingRecruit object
                            existingRecruits[row[1]] = {
                                name: row[0],
                                sessionCount: row[4],
                                startDate: row[2],
                                index,
                            }
                        }
                    })
                }

                // resolve promise
                resolve(existingRecruits)

            }
        })
    })
}

/**
 * A function that updates a recruit's voice session count
 **/
exports.updateSessionCount = (client, index, previousCount) => {

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

/**
 * A function for adding to feedback queue. Handles if new entry is made, or if something's pushed to existing
 * array.
 */
exports.addFeedbackToQueue = (client, recruit, recruiter) => {

    // check to see if the user already owes other feedback
    if (client.feedbackQueue[recruiter]) {

        // only add more feedback if there isn't currently feedback required
        if (!client.feedbackQueue[recruiter].includes(recruit)) {
            // if recruiter does, add feedback for the recruit who just left the channel
            client.feedbackQueue[recruiter].push(recruit)
        }

    } else {
        // if recruiter does not, then add new entry to feedbackQueue
        client.feedbackQueue[recruiter] = [recruit]
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