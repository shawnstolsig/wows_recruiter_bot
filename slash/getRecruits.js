const { Constants } = require("discord.js")

const Logger = require("../modules/logger")
const { recruits } = require("../modules/enmaps")
const { bold } = require("../modules/functions")

exports.run = async (client, interaction) => { // eslint-disable-line no-unused-vars
    await interaction.deferReply();
    const reply = await interaction.editReply("Fetching recruits...");
    Logger.log(`[get-recruits] ${interaction.member.displayName} showing recruits`)

    const storedRecruits = Array.from(recruits.values()).filter(recruit => !recruit.dateCompleted)

    if(!storedRecruits.length){
        await interaction.editReply(`There are no recruits! Please add some with the ${bold('/addRecruit')} command.`)
        return
    }

    storedRecruits.sort((a,b) => new Date(a.dateAdded) - new Date(b.dateAdded))
    const message = storedRecruits.map(({ id, name, voiceSessions, feedbacks, dateAdded, dateCompleted  }) => {
        return `${bold(name)}: added ${dateAdded.toLocaleDateString()}, feedback count: ${feedbacks} `
    }).join('\n')

    await interaction.editReply(message)

};

exports.commandData = {
    name: "get-recruits",
    description: "Shows currently active recruits ",
    options: [],
    defaultPermission: true,
};

// TODO: set guildOnly to true for this command
exports.conf = {
    permLevel: "Moderator",
    guildOnly: false
};