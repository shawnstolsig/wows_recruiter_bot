const { Constants } = require("discord.js")

const Logger = require("../modules/logger")
const { questions } = require("../modules/enmaps")
const { bold } = require("../modules/functions")

exports.run = async (client, interaction) => { // eslint-disable-line no-unused-vars
    await interaction.deferReply();
    const reply = await interaction.editReply("Fetching questions...");

    const { options } = interaction
    const order = options.getInteger('order')
    const text = options.getString('text')
    const choices = options.getString('choices')
    const role = options.getRole('role')

    questions.set(order.toString(), {
        order,
        text,
        choices,
        roleId: role?.id
    })

    await interaction.editReply(  `Question saved! \n(${order}) ${text} ${choices ? `\nChoices: [${choices}]` : ''} ${role ? `\nRole: ${role.name}` : ''}`)
    Logger.log(`[edit-question] ${interaction.member.displayName} edited question #${order}: ${text} (${choices}) [${role?.name}]`)

};

exports.commandData = {
    name: "edit-question",
    description: "Edit a recruiter feedback session question ",
    options: [{
        name: 'order',
        description: 'The order in which the question will be asked. Required.',
        required: true,
        type: Constants.ApplicationCommandOptionTypes.INTEGER
    },{
        name: 'text',
        description: 'The question itself. Required.',
        required: true,
        type: Constants.ApplicationCommandOptionTypes.STRING
    },{
        name: 'choices',
        description: 'Comma-separated choices for this question. Optional.',
        required: false,
        type: Constants.ApplicationCommandOptionTypes.STRING
    },{
        name: 'role',
        description: 'If this question is specific to any given roles.  Optional.',
        required: false,
        type: Constants.ApplicationCommandOptionTypes.ROLE
    }],
    defaultPermission: true,
};

// TODO: set guildOnly to true for this command
exports.conf = {
    permLevel: "Moderator",
    guildOnly: false
};