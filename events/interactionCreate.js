const logger = require("../modules/logger.js");
const { getSettings, permlevel } = require("../modules/functions.js");
const config = require("../config.js");
const { recruits, questions, recentFeedback } = require("../modules/enmaps")
const {bold} = require("../modules/functions");
const Logger = require("../modules/logger");

module.exports = async (client, interaction) => {
    // todo: context menu to manually send feedback
    if(interaction.isSelectMenu()) {

        // add recruit command
        if(interaction?.customId === 'addRecruitSelection'){
            const [id,displayName] = interaction.values[0].split(" - ")
            recruits.set(id,{
                id: id,
                name: displayName,
                feedbacks: 0,
                voiceSessions: 0,
                dateAdded: new Date(),
                dateCompleted: null
            })
            await interaction.update({ content: `${bold(displayName)} is now being tracked as a recruit!`, components: [] });
            Logger.log(`[add-recruit] ${interaction.member.displayName} added ${displayName}`)
        }

        // complete recruit command
        else if(interaction?.customId === 'completeRecruitSelection'){
            const [id,displayName] = interaction.values[0].split(" - ")
            recruits.set(id, new Date(), "dateCompleted")
            await interaction.update({ content: `${bold(displayName)} was marked as complete!`, components: [] });
            Logger.log(`[complete-recruit] ${interaction.member.displayName} completed ${displayName}`)
        }

        return
    }

    if(interaction.isButton()){
        // cancel selection
        if(interaction?.customId === 'cancelAddRecruit'){
            await interaction.update({ content: `Add recruit command canceled.`, components: [] });
            Logger.log(`[add-recruit] ${interaction.member.displayName} cancelled action`)
        }
        else if(interaction?.customId === 'cancelCompleteRecruit'){
            await interaction.update({ content: `Complete recruit command canceled.`, components: [] });
            Logger.log(`[complete-recruit] ${interaction.member.displayName} cancelled action`)
        } else if (interaction?.customId.substring(0,14) === 'cancelFeedback'){
            const recruitId = interaction.customId.split('-')[1]
            await interaction.update({ content: `Feedback session cancelled`, components: [] });
            Logger.log(`[feedback-cancel] ${interaction.user.username} cancelled a feedback session: ${recruitId}`)
        } else if (interaction?.customId.substring(0,13) === 'startFeedback'){
            const recruitId = interaction.customId.split('-')[1]
            await interaction.update({ content: `Feedback started.`, components: [] });
            Logger.log(`[feedback-start] ${interaction.user.username} started a feedback session: ${recruitId}`)
        }
    }

    if(interaction.isModalSubmit()){

        // HOLDING ONTO THIS CODE UNTIL MODAL SELECTIONS RELEASED
        // if(interaction.customId === 'questionModal'){
        //     const order = interaction.fields.getTextInputValue('questionOrderPicker')
        //     const text = interaction.fields.getTextInputValue('questionTextInput')
        //     const choices = interaction.fields.getTextInputValue('questionChoicesInput')
        //     const role = undefined
        //
        //     questions.set(order, {
        //         order,
        //         text,
        //         choices,
        //         roleId: role?.id
        //     })
        //
        //     await interaction.editReply(  `Question saved! \n(${order}) ${text} ${choices ? `\nChoices: [${choices}]` : ''} ${role ? `\nRole: ${role.name}` : ''}`)
        //     Logger.log(`[edit-question] ${interaction.member.displayName} edited question #${order}: ${text} (${choices}) [${role?.name}]`)
        // }

        if(interaction.customId === 'feedbackSession'){
            const clanRecommendation = interaction.fields.getTextInputValue('clanInput')

            recentFeedback.set(interaction.user.id, {
                clanInput: clanRecommendation
            })

            await interaction.editReply(  `Question saved! \n(${order}) ${text} ${choices ? `\nChoices: [${choices}]` : ''} ${role ? `\nRole: ${role.name}` : ''}`)
            Logger.log(`[feedback] ${interaction.member.displayName} edited question #${order}: ${text} (${choices}) [${role?.name}]`)
        }
    }

    // If it's not a command, stop.
    if(!interaction.isCommand()) return;

    // Grab the settings for this server from Enmap.
    // If there is no guild, get default conf (DMs)
    const settings = interaction.settings = getSettings(interaction.guild);

    // Get the user or member's permission level from the elevation
    const level = permlevel(interaction);

    // Grab the command data from the client.container.slashcmds Collection
    const cmd = client.container.slashcmds.get(interaction.commandName);

    // If that command doesn't exist, silently exit and do nothing
    if (!cmd) return;

    // Since the permission system from Discord is rather limited in regarding to
    // Slash Commands, we'll just utilise our permission checker.
    if (level < client.container.levelCache[cmd.conf.permLevel]) {
        // Due to the nature of interactions we **must** respond to them otherwise
        // they will error out because we didn't respond to them.
        return await interaction.reply({
            content: `This command can only be used by ${cmd.conf.permLevel}'s only`,
            // This will basically set the ephemeral response to either announce
            // to everyone, or just the command executioner. But we **HAVE** to
            // respond.
            ephemeral: settings.systemNotice !== "true"
        });
    }

    // If everything checks out, run the command
    try {
        await cmd.run(client, interaction);
        logger.log(`${config.permLevels.find(l => l.level === level).name} ${interaction.user.id} ran slash command ${interaction.commandName}`, "cmd");

    } catch (e) {
        console.error(e);
        if (interaction.replied)
            interaction.followUp({ content: `There was a problem with your request.\n\`\`\`${e.message}\`\`\``, ephemeral: true })
                .catch(e => console.error("An error occurred following up on an error", e));
        else
        if (interaction.deferred)
            interaction.editReply({ content: `There was a problem with your request.\n\`\`\`${e.message}\`\`\``, ephemeral: true })
                .catch(e => console.error("An error occurred following up on an error", e));
        else
            interaction.reply({ content: `There was a problem with your request.\n\`\`\`${e.message}\`\`\``, ephemeral: true })
                .catch(e => console.error("An error occurred replying on an error", e));
    }
};
