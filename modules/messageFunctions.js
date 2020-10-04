const {
    getName
} = require('./discordFunctions')

const {
    getCurrentRecruits
} = require('./sheetsFunctions')

/**
 * A function for sending a message to a user.
 */
exports.getFeedback = async (client, guild, recruiterID, recruitArray) => {

    // get GuildMember object for the recruiter, and then get the name (which will be either nickname or displayName)
    let recruiter = await guild.members.fetch(recruiterID)
    let recruiterName = getName(recruiter)

    // iterate through all the feedback owed by this recruiter
    for (const recruitID of recruitArray) {
        await messageRecruiter(client, recruiter, recruiterName, recruitID)
    }

    // remove recruiter's outstanding feedbacks.  NOTE this removes queued feedback, regardless if feedback was completed or not. 
    delete client.feedbackQueue[recruiterID]
}

/**
 * A function to write the answers of the feedback survey to the google sheet
 */
function recordFeedback(client, answers) {

    // add row to the Recruit sheet
    client.feedbackSheet.addRow(answers)
        .then(() => {
            client.logger.log(`${answers[2]} added feedback for ${answers[0]}. Answers: ${JSON.stringify(answers)}`)
        })
        .catch((err) => {
            client.logger.log(err, 'error');
            msg.edit(`Unable to add feedback to Google sheet.` + err)
        })


}

/**
 * Get feedback for a single recruit.  Returns a Promise, which resolves only once the feedback either times out or 
 * is completed.
 */
function messageRecruiter(client, recruiter, recruiterName, recruitID) {
    return new Promise((resolve, reject) => {
        // increment total feedbacks since bot was rebooted
        client.feedback.totals.total++

        // get GuildMember object for the recruit
        let recruit = await guild.members.fetch(recruitID)
        let recruitName = getName(recruit)

        // declare empty array to hold answers, prepopulate with recruiter's name and the date
        let dateAdded = new Date()
        let answers = [recruitName, recruit.id, recruiterName, recruiter.id, dateAdded.toLocaleDateString()]

        // define questions to ask recruiter
        const questions = [
            `Hi, ${recruiterName}! Looks like you recently finished a voice session with a potential recruit, ${recruitName}.\n\nDo you have time to leave some feedback on the recruit? Please reply with 'yes' or 'no'.`,
            `Great! ${recruitName} won't see this feedback, it'll only be used by clan leadership when reviewing ${recruitName}'s application. Reply with 'stop' at any time if you want to cancel your feedback. Just two questions: \n\n(1) Do you think ${recruitName} is a good fit for the KSx family?  Which group do you think ${recruitName} would fit into?\n *** Note: please reply with 'yes', 'no' and 'KSC', 'KSD', or 'KSE' (if you have an opinion).`,
            `(2) Why do you feel that way? Please include some remarks on ${recruitName}'s gameplay skill, communications, and personality.`,
        ];

        // Start of messaging sequence.
        try {
            client.logger.log(`${recruiterName} started feedback session.`);

            // cancel var will be used to stop the question sequence
            let cancel = false

            // iterate through each followup question                           ADD RESTART COMMAND?
            let message
            for (let i = 0; i < questions.length && cancel === false; i++) {

                // send question
                message = await recruiter.send(questions[i]);

                // wait for response
                await message.channel.awaitMessages(m => m.author.id === recruiter.id, { max: 1, time: 3600000, errors: ["time"] })

                    // once a response message arrives
                    .then(async collected => {

                        // if message is "stop" or "no", end session
                        if (collected.first().content.toLowerCase() === "stop" || collected.first().content.toLowerCase() === "no") {
                            await message.channel.send("Feedback session ended.");
                            cancel = true;

                            client.logger.log(`${recruiterName} cancelled their feedback.`, 'warn');

                            // Track recruiter feedback.
                            updateFeedbackStats(client, recruiterID, recruiterName, 'SKIPPED')

                            // reject promise
                            reject('SKIPPED')

                        }
                        // otherwise, assuming i>0 (we want to ignore the answer to the first question, which is just 'yes' or 'no')
                        else if (i > 0) {
                            answers.push(collected.first().content)
                        }
                    })
                    
                    //  catch happens when awaitMessage times out
                    .catch(async () => {
                        await message.channel.send("Feedback session timed out.");
                        cancel = true;

                        client.logger.log(`${recruiterName} let their feedback session time out.`, 'warn');

                        // Track recruiter feedback
                        updateFeedbackStats(client, recruiterID, recruiterName, 'TIMEOUT')

                        // reject promise
                        reject("TIMEOUT")
                    });
            }

            // after collecting all answers, check to see if user cancelled or not
            if (!cancel) {

                // if no cancel, then record their answers to the google doc
                recordFeedback(client, answers)
                
                await message.channel.send(":thumbsup: You're all done! Thank you for your time.");
                client.logger.log(`${recruiterName} finished feedback session.`);

                // Track recruiter feedback
                updateFeedbackStats(client, recruiterID, recruiterName, 'SUCCESS')

                // resolve promise
                resolve("SUCCESS")
            }

        } catch (err) {
            client.logger.log(`Error with getting recruiter feedback: ` + err);
        }

    })
}

/**
 * A function for updating the feedback stats
 */
function updateFeedbackStats(client, recruiterID, recruiterName, type) {

    if (type === 'SUCCESS') {
        client.feedback.totals.success++

        if (client.feedback[recruiterID]) {
            client.feedback[recruiterID].success++
            client.feedback[recruiterID].total++
            client.feedback[recruiterID].name = recruiterName
        } else {
            client.feedback[recruiterID] = {
                timedOut: 0,
                skipped: 0,
                success: 1,
                total: 1,
                name: recruiterName
            }
        }
    }
    else if (type === 'TIMEOUT') {
        client.feedback.totals.timedOut++

        if (client.feedback[recruiterID]) {
            client.feedback[recruiterID].timedOut++
            client.feedback[recruiterID].total++
            client.feedback[recruiterID].name = recruiterName
        } else {
            client.feedback[recruiterID] = {
                timedOut: 1,
                skipped: 0,
                success: 0,
                total: 1,
                name: recruiterName
            }
        }
    }
    else if (type === 'SKIPPED') {
        client.feedback.totals.skipped++

        if (client.feedback[recruiterID]) {
            client.feedback[recruiterID].skipped++
            client.feedback[recruiterID].total++
            client.feedback[recruiterID].name = recruiterName
        } else {
            client.feedback[recruiterID] = {
                timedOut: 0,
                skipped: 1,
                success: 0,
                total: 1,
                name: recruiterName
            }
        }
    }
}