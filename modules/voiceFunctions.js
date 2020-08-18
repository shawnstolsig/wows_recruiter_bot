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
exports.updateSessionCount = (client, row, previousCount) => {

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
exports.addFeedbackToQueue = (client, allFeedback, recruit, recruiter) => {

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

