const {
    Constants,
    MessageActionRow,
    MessageSelectMenu,
    MessageButton
} = require("discord.js")

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
                    feedbacks: [],
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

    // todo: ability to re-add previously completed recruit?

    await interaction.guild.members.fetch()
    const existingRecruitIds = Array.from(recruits.keys())
    const guestRole = await interaction.guild.roles.fetch(process.env.GUEST_ROLE_ID)
    const guests = guestRole.members
        .map(guest => {
            return {
                label: guest.displayName,
                value: `${guest.id} - ${guest.displayName}`,
                id: guest.id
            }
        })
        .filter(guest => !existingRecruitIds.includes(guest.id))

    if(!guests.length){
        await interaction.editReply(`No players with role ${bold(guestRole.name)} found.`)
        return
    }

    const actionRowTop = new MessageActionRow()
        .addComponents(
            new MessageSelectMenu()
                .setCustomId('addRecruitSelection')
                .setPlaceholder('Select a player...')
                .addOptions(guests)
        );
    const actionRowBottom = new MessageActionRow()
        .addComponents(
            new MessageButton()
                .setCustomId('cancelAddRecruit')
                .setLabel('Cancel')
                .setStyle('PRIMARY'),
        );

    await interaction.editReply({ content: "Select a player:", components: [actionRowTop,actionRowBottom] })

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