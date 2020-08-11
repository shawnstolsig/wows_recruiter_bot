/**
 * A function for sending a message to a user.
 */
exports.getFeedback = async (client, guild, recruiterID, recruitArray) => {

    // get GuildMember object for the recruiter
    let recruiter = await guild.members.fetch(recruiterID)

    // iterate through all the feedback owed by this recruiter
    for (const recruitID of recruitArray) {
        // get GuildMember object for the recruit
        let recruit = await guild.members.fetch(recruitID)

        // declare empty array to hold answers, prepopulate with recruiter's name and the date
        let dateAdded = new Date()
        let answers = [recruit.displayName, recruiter.displayName, dateAdded.toLocaleDateString()]

        // define questions to ask recruiter
        const questions = [
            `Hi, ${recruiter.displayName}! Looks like you recently finished a voice session with a potential recruit, ${recruit.displayName}.`,
            `Do you have time to leave some feedback on the recruit? Please reply with 'yes' or 'stop'.`,
            `Great! ${recruit.displayName} won't see this feedback, it'll only be used by clan leadership when reviewing ${recruit.displayName}'s application. Reply with 'stop' at any time if you want to cancel your feedback. Just two questions: \n\n(1) Do you think ${recruit.displayName} is a good fit for the KSx family?  Which group do you think ${recruit.displayName} would fit into?\n *** Note: please reply with 'yes', 'no' and 'KSC', 'KSD', or 'KSE' (if you have an opinion).`,
            `(2) Why do you feel that way? Please include some remarks on ${recruit.displayName}'s gameplay skill, communications, and personality.`,
        ];

        // Start of messaging sequence.
        try {
            client.logger.log(`${recruiter.displayName} started feedback session.`);

            // cancel var will be used to stop the question sequence
            let cancel = false

            // send first message. 
            let message = await recruiter.send(questions[0])

            // iterate through each followup question                           ADD RESTART COMMAND?
            for (let i = 1; i < questions.length && cancel === false; i++) {
                await message.channel.send(questions[i]);
                await message.channel.awaitMessages(m => m.author.id === recruiter.id, { max: 1, time: 300000, errors: ["time"] })
                    .then(async collected => {
                        if (collected.first().content.toLowerCase() === "stop") {
                            await message.channel.send("Feedback session ended.");
                            cancel = true;

                            client.logger.log(`${recruiter.displayName} cancelled their feedback.`, 'warn');
                        } else {
                            // only add answers after the first answer for 'do you have time for survey'
                            if(i>1){
                                answers.push(collected.first().content)
                            }
                        }
                    }).catch(async () => {
                        await message.channel.send("Feedback session timed out.");
                        cancel = true;

                        client.logger.log(`${recruiter.displayName} let their feedback session time out.`);
                    });
            }

            client.logger.log(`${recruiter.displayName} finished feedback session. answers: ${JSON.stringify(answers)}`);
            if (!cancel) {
                recordFeedback(client, answers)
                await message.channel.send(":thumbsup: You're all done! Thank you for your time.");
            }

        } catch (err) {
            client.logger.log(`Error with getting recruiter feedback: ` + err);
        }
    }

    // remove recruiter's outstanding feedbacks
    delete client.feedbackQueue[recruiterID]
    client.logger.log(`Feedback cleared for ${recruiter.displayName}.  client.feedbackQueue = ${JSON.stringify(client.feedbackQueue)}`)
}

/**
 * A function to write the answers of the feedback survey to the google sheet
 */
function recordFeedback(client, answers) {

    let resource = {
        values: [answers],
    };

    // append new recruit to google sheet
    client.sheet.spreadsheets.values.append({
        spreadsheetId: client.spreadsheetId,
        range: 'Feedback',
        valueInputOption: 'USER_ENTERED',
        resource,
    }, (err, result) => {
        // handle errors
        if (err) {
            client.logger.log(`Unable to add feedback to Google sheet. ` + err, 'error')
        }
        // print success message
        else {
            client.logger.log('Feedback added to Google sheets!', 'ready')
        }
    });

}