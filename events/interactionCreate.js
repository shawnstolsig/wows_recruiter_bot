const {
    Constants,
    MessageActionRow,
    MessageSelectMenu,
    MessageButton,
    TextInputComponent,
    Modal
} = require("discord.js")
const logger = require("../modules/logger.js");
const { getSettings, permlevel } = require("../modules/functions.js");
const config = require("../config.js");
const { recruits, questions, recentFeedback, recruitActivityPosts} = require("../modules/enmaps")
const {bold} = require("../modules/functions");
const Logger = require("../modules/logger");

module.exports = async (client, interaction) => {
    if(interaction.isSelectMenu()) {

        // add recruit command
        if(interaction?.customId === 'addRecruitSelection'){
            const [id,displayName] = interaction.values[0].split(" - ")
            recruits.set(id,{
                id: id,
                name: displayName,
                feedbacks: [],
                voiceSessions: 0,
                dateAdded: new Date(),
                dateCompleted: null
            })
            await interaction.update({ content: `${bold(displayName)} is now being tracked as a recruit!`, components: [] });
            Logger.log(`[add-recruit] ${interaction.member.displayName} added ${displayName}`)
        }

        else if(interaction?.customId === 'recruitGroupSelection'){
            const guestRole = await interaction.guild.roles.fetch(process.env.GUEST_ROLE_ID)
            const guests = guestRole.members
                .filter(guest => new Date() - guest.joinedAt < 31540000000 )  // joined KSx discord in the last year
                .map(guest => ({
                    name: guest.displayName,
                    id: guest.id,
                    label: guest.displayName,
                    value: `${guest.id} - ${guest.displayName}`,
                }))
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
            allGuests.push(grouping)

            const selectedGrouping = allGuests[interaction.values[0]]

            // update components so that there's a player selection
            const actionRowTop = new MessageActionRow()
                .addComponents(
                    new MessageSelectMenu()
                        .setCustomId('addRecruitSelection')
                        .setPlaceholder('Select a player...')
                        .addOptions(selectedGrouping)
                );
            const actionRowBottom = new MessageActionRow()
                .addComponents(
                    new MessageButton()
                        .setCustomId('cancelAddRecruit')
                        .setLabel('Cancel')
                        .setStyle('PRIMARY'),
                );
            await interaction.update({ content: "Select a player...", components: [actionRowTop,actionRowBottom] })

        }

        // complete recruit command
        else if(interaction?.customId === 'completeRecruitSelection'){
            const [id,displayName] = interaction.values[0].split(" - ")
            recruits.set(id, new Date(), "dateCompleted")
            await interaction.update({ content: `${bold(displayName)} was marked as complete!`, components: [] });

            const activityPost = recruitActivityPosts.get(id)
            if(activityPost) {
                const recruitingChannel = interaction.guild.channels.cache.get(process.env.RECRUITING_CHANNEL)
                const message = await recruitingChannel.messages.fetch(activityPost)
                recruitActivityPosts.delete(id)
                await message.delete();
            }

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
            const {recruit, recruiter} = await getRecruitAndRecruiter(client,interaction.customId.split('-')[1],interaction.user.id)
            await interaction.update({ content: `Feedback session cancelled`, components: [] });
            Logger.log(`[feedback-cancel] ${recruiter.displayName} cancelled a feedback session: ${recruit.displayName}`)
        } else if (interaction?.customId.substring(0,13) === 'startFeedback'){
            const {recruit, recruiter} = await getRecruitAndRecruiter(client,interaction.customId.split('-')[1],interaction.user.id)

            Logger.log(`[feedback-start] ${recruiter.displayName} started a feedback session: ${recruit.displayName}`)

            const modal = new Modal()
              .setCustomId(`feedbackModal-${recruit.id}`)
              .setTitle(`Recruit Feedback: ${recruit.displayName}`);

            const storedQuestions = Array.from(questions.values())
              .filter(question => !question.roleId || recruiter.roles.cache.has(question.roleId))
            storedQuestions.sort((a,b) => a.order - b.order)

            const rows = storedQuestions.map(question => {
                const row = new MessageActionRow()
                const component = new TextInputComponent()
                    .setCustomId(`question${question.order}`)
                    .setLabel(`Question #${question.order}`)
                    .setPlaceholder(question.text)
                    .setStyle(question.answerLength)
                    .setRequired(true)
                    .setMinLength(1)
                    .setMaxLength(question.answerLength === 'SHORT' ? 32 : 500)
                row.addComponents(component)
                return row
            })

            modal.addComponents(...rows);
            await interaction.showModal(modal);

        }
    }

    if(interaction.isModalSubmit()){
        if(interaction?.customId.substring(0,13) === 'feedbackModal'){
            const {recruit, recruiter} = await getRecruitAndRecruiter(client,interaction.customId.split('-')[1],interaction.user.id)

            const storedQuestions = Array.from(questions.values())
              .filter(question => !question.roleId || recruiter.roles.cache.has(question.roleId))
            storedQuestions.sort((a,b) => a.order - b.order)
            const questionResponses = storedQuestions.map(question => ({
                    order: question.order,
                    question: question.text,
                    response: interaction.fields.getTextInputValue(`question${question.order}`)
              }))
            const feedback = {
                timestamp: new Date(),
                recruiterId: recruiter.id,
                recruiterName: recruiter.displayName,
                recruitId: recruit.id,
                recruitName: recruit.displayName,
                addedToGoogleSheet: false,
                questions: questionResponses
            }
            const recruiterRecentFeedback = recentFeedback.get(interaction.user.id) || []
            recruiterRecentFeedback.push(feedback)
            recentFeedback.set(interaction.user.id,recruiterRecentFeedback)
            recruits.push(recruit.id, feedback, 'feedbacks')

            await interaction.update({content: `Your feedback has been recorded, thank you!\n${bold(feedback.timestamp.toLocaleDateString())}: ${bold(recruit.displayName)}\n${questionResponses.map(question => `(${question.order}) ${question.question} ${bold(question.response)}`).join('\n')}`, components: []})
            Logger.log(`[feedback-submit] ${recruiter.displayName} for ${recruit.displayName}: ${JSON.stringify(questionResponses)}`)
        }
    }

    if(interaction.isContextMenu()){

        if(interaction.commandName === 'feedback'){
            const { recruit, recruiter } = await getRecruitAndRecruiter(client, interaction.targetId, interaction.user.id)
            const storedRecruit = recruits.get(recruit.id)

            if(!recruiter.roles.cache.has(process.env.RECRUITER_ROLE_ID)){
                await interaction.reply({
                    content: `You don't have permissions for this command.`,
                    ephemeral: true
                })
                Logger.log(`[manual-feedback] Non-recruiter tried to leave manual feedback: ${recruiter.displayName}`);
                return
            }

            if(!storedRecruit){
                await interaction.reply({
                    content: `Selected player is not a recruit, aborting.`,
                    ephemeral: true
                })
                Logger.log(`[manual-feedback] ${recruiter.displayName} tried to use command for non-recruit, aborting`);
                return
            }

            if(storedRecruit.dateCompleted){
                await interaction.reply({
                    content: `Selected recruit is no longer active, aborting.`,
                    ephemeral: true
                })
                Logger.log(`[manual-feedback] ${recruiter.displayName} tried to use command for inactive recruit, aborting`);
                return
            }

            const cancelButton = new MessageButton()
              .setCustomId(`cancelFeedback-${recruit.id}`)
              .setLabel('Cancel')
              .setStyle('SECONDARY')
            const startButton = new MessageButton()
              .setCustomId(`startFeedback-${recruit.id}`)
              .setLabel('Start')
              .setStyle('PRIMARY')
            const row = new MessageActionRow()
              .addComponents(cancelButton)
              .addComponents(startButton);
            interaction.member.send({
                content: `Would you like to leave feedback for recruit ${bold(recruit.displayName)}?`,
                components: [row]
            })

            await interaction.reply({
                content: `Starting feedback session, check your DMs.`,
                ephemeral: true
            })
            Logger.log(`[manual-feedback] ${interaction.member.displayName} started manual feedback session for ${recruit.displayName}`);


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

async function getRecruitAndRecruiter(client, recruitId, recruiterId){
    const guild = await client.guilds.fetch(process.env.GUILD_ID)
    const recruit = await guild.members.fetch(recruitId)
    const recruiter = await guild.members.fetch(recruiterId)
    return {
        recruit,
        recruiter
    }
}