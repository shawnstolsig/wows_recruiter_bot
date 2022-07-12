// noinspection ES6MissingAwait

const logger = require("./logger.js");
const config = require("../config.js");
const { settings, recruits, recentFeedback } = require("./enmaps.js");
// Let's start by getting some useful functions that we'll use throughout
// the bot, like logs and elevation features.

/*
  PERMISSION LEVEL FUNCTION

  This is a very basic permission system for commands which uses "levels"
  "spaces" are intentionally left black so you can add them if you want.
  NEVER GIVE ANYONE BUT OWNER THE LEVEL 10! By default this can run any
  command including the VERY DANGEROUS `eval` and `exec` commands!

  */
function permlevel(message) {
    let permlvl = 0;

    const permOrder = config.permLevels.slice(0).sort((p, c) => p.level < c.level ? 1 : -1);

    while (permOrder.length) {
        const currentLevel = permOrder.shift();
        if (message.guild && currentLevel.guildOnly) continue;
        if (currentLevel.check(message)) {
            permlvl = currentLevel.level;
            break;
        }
    }
    return permlvl;
}

/*
  GUILD SETTINGS FUNCTION

  This function merges the default settings (from config.defaultSettings) with any
  guild override you might have for particular guild. If no overrides are present,
  the default settings are used.

*/

// getSettings merges the client defaults with the guild settings. guild settings in
// enmap should only have *unique* overrides that are different from defaults.
function getSettings(guild) {
    settings.ensure("default", config.defaultSettings);
    if (!guild) return settings.get("default");
    const guildConf = settings.get(guild.id) || {};
    // This "..." thing is the "Spread Operator". It's awesome!
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Spread_syntax
    return ({...settings.get("default"), ...guildConf});
}

/*
  SINGLE-LINE AWAIT MESSAGE

  A simple way to grab a single reply, from the user that initiated
  the command. Useful to get "precisions" on certain things...

  USAGE

  const response = await awaitReply(msg, "Favourite Color?");
  msg.reply(`Oh, I really love ${response} too!`);

*/
async function awaitReply(msg, question, limit = 60000) {
    const filter = m => m.author.id === msg.author.id;
    await msg.channel.send(question);
    try {
        const collected = await msg.channel.awaitMessages({ filter, max: 1, time: limit, errors: ["time"] });
        return collected.first().content;
    } catch (e) {
        return false;
    }
}

/**
 * Runs on a cronjob to keep the enmaps of this Discord bot in sync with a Google sheet
 */
async function googleSync(client){

    // abort if Google connection not made (might occur during bot startup)
    if(!client.container?.google?.feedbackSheet || !client.container?.google?.recruitSheet) return;
    const { feedbackSheet, recruitSheet } = client.container.google

    // Feedback sync
    const storedRecentFeedback = Array.from(recentFeedback.values())

    const msTimeDelta = client.container.constants.MIN_HOURS_BETWEEN_VOICE_SESSIONS * 60 * 60 * 1000
    const now = new Date()

    let rows = []
    storedRecentFeedback.forEach(recruiterFeedback => {
         recruiterFeedback.forEach(feedback => {
             if(feedback.addedToGoogleSheet) return;
             const { recruitName, recruitId, recruiterName, recruiterId, timestamp, questions } = feedback
             rows.push([
                 recruitName,
                 recruitId,
                 recruiterName,
                 recruiterId,
                 timestamp.toLocaleDateString(),
                 questions[0]?.response,
                 questions[1]?.response,
                 questions[2]?.response,
                 questions[3]?.response,
                 questions[4]?.response
             ])
         })
    })

    const splitFeedback = storedRecentFeedback.map(recruiterFeedback => {
        return {
            preserveInBot: recruiterFeedback.filter(feedback => now - new Date(feedback.timestamp) < msTimeDelta).map(feedback => ({...feedback, addedToGoogleSheet: true})),
            removeFromBot: recruiterFeedback.filter(feedback => now - new Date(feedback.timestamp) >= msTimeDelta)
        }
    })

    let purgeCounter = 0
    splitFeedback.forEach(({preserveInBot,removeFromBot}) => {
        const recruiterId = removeFromBot[0]?.recruiterId || preserveInBot[0]?.recruiterId
        purgeCounter += removeFromBot.length

        if(preserveInBot.length){
            recentFeedback.set(recruiterId, preserveInBot)
        } else {
            recentFeedback.delete(recruiterId)
        }

    })

    if(rows.length){
        await feedbackSheet.addRows(rows)
    }
    logger.log(`[spreadsheet-feedback] Google sheet sync complete. Added ${rows.length} feedbacks. Purged ${purgeCounter} feedbacks from bot.`)


    // Recruit feedback
    const botRecruits = Array.from(recruits.values())

    let recruitCells = await recruitSheet.getRows()
    const spreadsheetRecruits = recruitCells.map(row => row['Discord ID'])

    recruitCells.forEach(async row => {

        const storedRecruit = botRecruits.find(recruit => recruit.id === row['Discord ID'])

        // reverse sync bot from Google sheet
        if(!storedRecruit){
            recruits.set(row['Discord ID'], {
                id: row['Discord ID'],
                name: row['Name'],
                feedbacks: [],
                voiceSessions: Number(row['Voice Session Count']),
                dateAdded: new Date(row['Date Added']),
                dateCompleted: row['Date Completed'] ? new Date(row['Date Completed']) : null
            })
            logger.log(`[spreadsheet-recruit] Synced ${row['Name']} (${row['Discord ID']}) from sheet to bot`)
            return
        }

        // NOTE: The bot's data takes priority over the spreadsheets.  Is this the best way to do it?
        // todo: Add a flag to signal when an update is required, so that the sheet can be used to update the bot's db?
        let save
        if(row['Voice Session Count'] != storedRecruit.voiceSessions){
            logger.log(`[spreadsheet-recruit] Updating ${storedRecruit.name} voice session count: ${storedRecruit.voiceSessions}`)
            row['Voice Session Count'] = storedRecruit.voiceSessions
            save = true
        }
        if(row['Feedback Count'] != storedRecruit.feedbacks.length){
            logger.log(`[spreadsheet-recruit] Updating ${storedRecruit.name} feedback count: ${storedRecruit.feedbacks.length}`)
            row['Feedback Count'] = storedRecruit.feedbacks.length
            save = true
        }
        if(!row['Date Completed'] && storedRecruit.dateCompleted){
            const completed = new Date(storedRecruit.dateCompleted).toLocaleDateString()
            logger.log(`[spreadsheet-recruit] Updating ${storedRecruit.name} date completed: ${completed}`)
            row['Date Completed'] = completed
            save = true
        }
        if(save){
            try {
                await row.save();
                // todo: remove this?  find better way to handle google sheet rate limit
                await wait(100) // help with Google sheets rate limit
            } catch(e){
                logger.log('`Google sheets failed to save, API limit exceeded (?)', 'error')
            }
        }
    })

    // add any new recruits to Google sheets
    const newRecruitRows = botRecruits.filter(storedRecruit => !spreadsheetRecruits.includes(storedRecruit.id))
    const newRows = newRecruitRows.map(recruit =>
        [
            recruit.name,
            recruit.id,
            new Date(recruit.dateAdded).toLocaleDateString(),
            null,
            recruit.voiceSessions,
            recruit.feedbacks.length
        ])
    if(newRows.length){
        await recruitSheet.addRows(newRows)
        logger.log(`[spreadsheet-recruits] Added new recruits: ${newRecruitRows.map(r => r.name)}`)
    }

}


/* MISCELLANEOUS NON-CRITICAL FUNCTIONS */

// toProperCase(String) returns a proper-cased string such as: 
// toProperCase("Mary had a little lamb") returns "Mary Had A Little Lamb"
function toProperCase(string) {
    return string.replace(/([^\W_]+[^\s-]*) */g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
}

// adds markdown ** ** for turning string into bold
function bold(string){
    return `**${string}**`
}

// a wait function to help with Google sheets 100 req per 100 sec limit
function wait(time) {
    return new Promise(resolve => {
        setTimeout(() => {
            resolve();
        }, time);
    });
}

// These 2 process methods will catch exceptions and give *more details* about the error and stack trace.
process.on("uncaughtException", (err) => {
    const errorMsg = err.stack.replace(new RegExp(`${__dirname}/`, "g"), "./");
    logger.error(`Uncaught Exception: ${errorMsg}`);
    console.error(err);
    // Always best practice to let the code crash on uncaught exceptions.
    // Because you should be catching them anyway.
    process.exit(1);
});

process.on("unhandledRejection", err => {
    logger.error(`Unhandled rejection: ${err}`);
    console.error(err);
});

module.exports = { getSettings, permlevel, awaitReply, toProperCase, bold, googleSync };