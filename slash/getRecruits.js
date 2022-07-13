const { Constants, MessageEmbed } = require("discord.js")

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

    const recruitsEmbed = new MessageEmbed()
        .setColor('#38ffee')
        .setTitle(`Active recruits (${storedRecruits.length})`)

    storedRecruits.forEach(({ id, name, voiceSessions, feedbacks, dateAdded, dateCompleted  }) => {
        recruitsEmbed.addFields({
            name: name,
            value: ` \`\`\`${dateAdded.toLocaleDateString()}    FB: ${feedbacks.length}    VS: ${voiceSessions} \`\`\``
        })
    })
    recruitsEmbed.setFooter({ text: 'date added  FB: feedbacks received  VS: voice session count '});

    await interaction.editReply({ content: null, embeds: [recruitsEmbed]})

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