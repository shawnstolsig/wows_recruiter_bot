const {
    Constants,
    MessageActionRow,
    MessageSelectMenu,
    MessageButton
} = require("discord.js")

const Logger = require("../modules/logger")
const { recruits, recruitActivityPosts} = require("../modules/enmaps")
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

                const activityPost = recruitActivityPosts.get(member.id)
                if(activityPost) {
                    const recruitingChannel = interaction.guild.channels.cache.get(process.env.RECRUITING_CHANNEL)
                    const message = await recruitingChannel.messages.fetch(activityPost)
                    recruitActivityPosts.delete(member.id)
                    await message.delete();
                }

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
        }
    })

    if(!recruitOptions.length){
        await interaction.editReply(`No recruits found.`)
        return
    }

    const actionRowTop = new MessageActionRow()
        .addComponents(
            new MessageSelectMenu()
                .setCustomId('completeRecruitSelection')
                .setPlaceholder('Select a recruit...')
                .addOptions(recruitOptions)
        );
    const actionRowBottom = new MessageActionRow()
        .addComponents(
            new MessageButton()
                .setCustomId('cancelCompleteRecruit')
                .setLabel('Cancel')
                .setStyle('PRIMARY'),
        );

    await interaction.editReply({ content: "Select a player:", components: [actionRowTop,actionRowBottom] })

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

exports.conf = {
    permLevel: "Moderator",
    guildOnly: true
};