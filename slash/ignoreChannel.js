const { Constants } = require("discord.js")

const Logger = require("../modules/logger")
const { ignoredChannels } = require("../modules/enmaps")
const { bold } = require("../modules/functions")

exports.run = async (client, interaction) => { // eslint-disable-line no-unused-vars
    await interaction.deferReply();
    const reply = await interaction.editReply("Fetching channels...");

    const { options } = interaction
    const channel = options.getChannel('channel')

    const existing = ignoredChannels.get(channel.id)
    if(existing){
        ignoredChannels.delete(channel.id)
        if(existing === 'category'){
            await interaction.editReply(`Voice channels in category ${bold(channel.name)} will no longer be ignored.`);
            Logger.log(`[ignore-channel] ${interaction.member.displayName} no longer ignoring category channel ${channel.name} `)
        } else if (existing === 'voice'){
            await interaction.editReply(`Voice channel ${bold(channel.name)} will no longer be ignored.`);
            Logger.log(`[ignore-channel] ${interaction.member.displayName} no longer ignoring voice channel ${channel.name} `)
        }
        return
    }

    if(channel.children){
        ignoredChannels.set(channel.id, 'category')
        await interaction.editReply(`Voice channels in category ${bold(channel.name)} will now be ignored.`);
        Logger.log(`[ignore-channel] ${interaction.member.displayName} now ignoring category channel: ${channel.name}`)
    } else {
        ignoredChannels.set(channel.id, 'voice')
        await interaction.editReply(`Voice channel ${bold(channel.name)} will now be ignored.`);
        Logger.log(`[ignore-channel] ${interaction.member.displayName} now ignoring voice channel: ${channel.name}`)
    }

};

exports.commandData = {
    name: "ignore-channel",
    description: "Toggles if the bot ignores a voice channel for recruit/recruiter interactions",
    options: [{
        name: 'channel',
        description: 'The voice channel (or parent category channel) to toggle. Required.',
        required: true,
        type: Constants.ApplicationCommandOptionTypes.CHANNEL
    }],
    defaultPermission: true,
};

// TODO: set guildOnly to true for this command
exports.conf = {
    permLevel: "Moderator",
    guildOnly: false
};