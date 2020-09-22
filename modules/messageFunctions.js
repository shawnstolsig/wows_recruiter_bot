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
        // increment total feedbacks since bot was rebooted
        client.feedback.total++

        // get GuildMember object for the recruit
        let recruit = await guild.members.fetch(recruitID)
        let recruitName = getName(recruit)

        // declare empty array to hold answers, prepopulate with recruiter's name and the date
        let dateAdded = new Date()
        let answers = [recruitName, recruit.id, recruiterName, recruiter.id, dateAdded.toLocaleDateString()]

        // define questions to ask recruiter
        const questions = [
            `Hi, ${recruiterName}! Looks like you recently finished a voice session with a potential recruit, ${recruitName}.\n\nDo you have time to leave some feedback on the recruit? Please reply with 'yes' or 'stop'.`,
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
                message = await recruiter.send(questions[i]);
                await message.channel.awaitMessages(m => m.author.id === recruiter.id, { max: 1, time: 18000000, errors: ["time"] })
                    .then(async collected => {
                        if (collected.first().content.toLowerCase() === "stop") {
                            await message.channel.send("Feedback session ended.");
                            cancel = true;

                            client.logger.log(`${recruiterName} cancelled their feedback.`, 'warn');
                            client.feedback.skipped++
                            // ADD NEW SHEET FOR RECORDING INSTANCES WHERE RECRUITER SKIPPED FEEDBACK?
                        } else {
                            // ignore first answer, which is a response to 'do you have time for feedback'
                            if(i>0){
                                answers.push(collected.first().content)
                            }
                        }
                    }).catch(async () => {
                        await message.channel.send("Feedback session timed out.");
                        cancel = true;

                        client.logger.log(`${recruiterName} let their feedback session time out.`, 'warn');
                        client.feedback.timedOut++
                        // ADD NEW SHEET FOR RECORDING INSTANCES WHERE RECRUITER SKIPPED FEEDBACK?
                    });
            }

            
            if (!cancel) {
                recordFeedback(client, answers)
                await message.channel.send(":thumbsup: You're all done! Thank you for your time.");
                client.logger.log(`${recruiterName} finished feedback session.`);
            }

        } catch (err) {
            client.logger.log(`Error with getting recruiter feedback: ` + err);
        }
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