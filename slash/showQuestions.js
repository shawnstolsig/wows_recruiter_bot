const { Constants } = require("discord.js")

const Logger = require("../modules/logger")
const { questions } = require("../modules/enmaps")
const { bold } = require("../modules/functions")

exports.run = async (client, interaction) => { // eslint-disable-line no-unused-vars
    await interaction.deferReply();
    const reply = await interaction.editReply("Fetching questions...");
    Logger.log(`[show-question] ${interaction.member.displayName} showing questions`)

    const storedQuestions = Array.from(questions.values())

    if(!storedQuestions.length){
        await interaction.editReply(`There are no questions configured! Please set some up with the ${bold('/editQuestion')} command.`)
        return
    }

    storedQuestions.sort((a,b) => a.order - b.order)
    const message = storedQuestions.map(({ order, text, choices, roleId  }) => {
        let role
        if(roleId){
            role = interaction.guild.roles.cache.get(roleId)
        }
        return `(${order}) ${text} ${choices ? `\nChoices: [${choices}]` : ''} ${role ? `\nRole: ${role.name}` : ''}`
    }).join('\n\n')

    await interaction.editReply(message)

};

exports.commandData = {
    name: "show-questions",
    description: "Shows the questions asked during each feedback session ",
    options: [],
    defaultPermission: true,
};

// TODO: set guildOnly to true for this command
exports.conf = {
    permLevel: "Moderator",
    guildOnly: false
};