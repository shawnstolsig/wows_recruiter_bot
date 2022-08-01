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

    await interaction.guild.members.fetch()
    const existingRecruitIds = Array.from(recruits.keys())
    const guestRole = await interaction.guild.roles.fetch(process.env.GUEST_ROLE_ID)
    const guests = guestRole.members
        .filter(guest => new Date() - guest.joinedAt < 31540000000 )  // joined KSx discord in the last year
        .map(guest => ({
            name: guest.displayName,
            id: guest.id
        }))

    if(!guests.length){
        await interaction.editReply(`No players with role ${bold(guestRole.name)} found.`)
        return
    }

    // sort alphabetically
    guests.sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()))

    let allGuests = []
    let grouping = []
    let counter = 0
    while(counter < guests.length){
        grouping.push(guests[counter])
        if(grouping.length === 25){
            allGuests.push(grouping)
            grouping = []
        }
        counter++
    }
    if(grouping.length){
        allGuests.push(grouping)
    }

    const selectionOptions = allGuests.map((grouping,i) => ({
        label: `${grouping.at(0).name} <===> ${grouping.at(-1).name}`,
        // value: `${grouping.at(0).id} <===> ${grouping.at(-1).id}`,
        value: i.toString(),
        id: i
    }))

    // const guests = guestRole.members
    //     .map(guest => {
    //         return {
    //             label: guest.displayName,
    //             value: `${guest.id} - ${guest.displayName}`,
    //             id: guest.id
    //         }
    //     })
    //     .filter(guest => !existingRecruitIds.includes(guest.id))

    const actionRowTop = new MessageActionRow()
        .addComponents(
            new MessageSelectMenu()
                .setCustomId('recruitGroupSelection')
                .setPlaceholder('Select player range...')
                .addOptions(selectionOptions)
        );
    const actionRowBottom = new MessageActionRow()
        .addComponents(
            new MessageButton()
                .setCustomId('cancelAddRecruit')
                .setLabel('Cancel')
                .setStyle('PRIMARY'),
        );

    await interaction.editReply({ content: "Select player range:", components: [actionRowTop,actionRowBottom] })

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

exports.conf = {
    permLevel: "Administrator",
    guildOnly: true
};