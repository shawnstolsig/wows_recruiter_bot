const { Constants, MessageActionRow, MessageSelectMenu } = require("discord.js")

const Logger = require("../modules/logger")
const { recruits } = require("../modules/enmaps")
const { bold } = require("../modules/functions")

exports.run = async (client, interaction) => { // eslint-disable-line no-unused-vars
    await interaction.deferReply();
    const reply = await interaction.editReply("Fetching players...");

    const { options } = interaction
    const playerId = options.getString('player-discord-id')

    try {
        if(playerId){
            const member = await interaction.guild.members.fetch(playerId)
            if(member){
                recruits.set(member.id, {
                    id: member.id,
                    name: member.displayName ,
                    feedbacks: 0,
                    voiceSessions: 0,
                    dateAdded: new Date(),
                    dateCompleted: null
                })
                await interaction.editReply(`${bold(member.displayName)} is now being tracked as a recruit!`);
                Logger.log(`[add-recruit] ${interaction.member.displayName} added ${member.displayName}`)
                return
            }
        }
    } catch (e) {
        Logger.log(`[add-recruit] ${interaction.member.displayName} unable to add recruit with input id: ${playerId}`,'warn')
    }

    await interaction.guild.members.fetch()
    const guestRole = await interaction.guild.roles.fetch(process.env.GUEST_ROLE_ID)
    const guests = guestRole.members.map(guest => {
        return {
            label: guest.displayName,
            value: `${guest.id} - ${guest.displayName}`,
            // description: guest.user.tag
        }
    })

    if(!guests.length){
        await interaction.editReply(`No players with role ${bold(guestRole.name)} found.`)
        return
    }

    const actionRow = new MessageActionRow()
        .addComponents(
            new MessageSelectMenu()
                .setCustomId('addRecruitSelection')
                .setPlaceholder('Select a player...')
                .addOptions(guests)
        );

    await interaction.editReply({ content: "Select a player:", components: [actionRow] })

};

exports.commandData = {
    name: "add-recruit",
    description: "Adds player to recruit list",
    options: [{
        name: 'player-discord-id',
        description: 'The Discord ID of the new recruit. Optional.',
        required: false,
        type: Constants.ApplicationCommandOptionTypes.STRING
    }],
    defaultPermission: true,
};

// TODO: set guildOnly to true for this command
exports.conf = {
    permLevel: "Moderator",
    guildOnly: false
};