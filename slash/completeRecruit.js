const { Constants, MessageActionRow, MessageSelectMenu } = require("discord.js")

const Logger = require("../modules/logger")
const { recruits } = require("../modules/enmaps")
const { bold } = require("../modules/functions")

exports.run = async (client, interaction) => { // eslint-disable-line no-unused-vars
    await interaction.deferReply({
        ephemeral: true
    });
    const reply = await interaction.editReply("Fetching recruits...");

    const { options } = interaction
    const playerId = options.getString('player-discord-id')

    try {
        if(playerId){
            const member = await interaction.guild.members.fetch(playerId)
            if(member){
                recruits.set(member.id, new Date(), "dateCompleted")
                await interaction.editReply(`${bold(member.displayName)} was marked as complete!`);
                Logger.log(`[complete-recruit] ${interaction.member.displayName} completed ${member.displayName}`)
                return
            }
        }
    } catch (e) {
        Logger.log(`[complete-recruit] ${interaction.member.displayName} unable to complete recruit with input id: ${playerId}`,'warn')
    }

    const activeRecruits = Array.from(recruits.values()).filter(recruit => !recruit.dateCompleted)
    const recruitOptions = activeRecruits.map(recruit => {
        return {
            label: recruit.name,
            value: `${recruit.id} - ${recruit.name}`,
            // description: guest.user.tag
        }
    })

    if(!recruitOptions.length){
        await interaction.editReply(`No recruits found.`)
        return
    }

    const actionRow = new MessageActionRow()
        .addComponents(
            new MessageSelectMenu()
                .setCustomId('completeRecruitSelection')
                .setPlaceholder('Select a recruit...')
                .addOptions(recruitOptions)
        );

    await interaction.editReply({ content: "Select a player:", components: [actionRow] })

};

exports.commandData = {
    name: "complete-recruit",
    description: "Completes a recruit",
    options: [{
        name: 'player-discord-id',
        description: 'The Discord ID of the recruit. Optional.',
        required: false,
        type: Constants.ApplicationCommandOptionTypes.STRING
    }],
    defaultPermission: true,
};

// TODO: set guildOnly to true for this command
exports.conf = {
    permLevel: "Administrator",
    guildOnly: false
};