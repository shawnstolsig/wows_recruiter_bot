const {
  Constants,
  // MessageActionRow,
  // MessageSelectMenu,
  // MessageButton,
  // TextInputComponent,
  // Modal
} = require("discord.js");

const Logger = require("../modules/logger");
const {questions} = require("../modules/enmaps");
const {bold} = require("../modules/functions");

exports.run = async (client, interaction) => { // eslint-disable-line no-unused-vars

  // HOLDING ONTO THIS CODE UNTIL SELECTION MENUS ARE ALLOWED IN MODALS
  // const modal = new Modal()
  //   .setCustomId('questionModal')
  //   .setTitle('Edit Question');
  //
  // const orderPicker = new MessageSelectMenu()
  //   .setCustomId('questionOrderPicker')
  //   .setPlaceholder('Select question number...')
  //   .addOptions([
  //       { label: "First", value: "first" },
  //       { label: "Second", value: "second" },
  //       { label: "Third", value: "third" },
  //       { label: "Fourth", value: "fourth" },
  //       { label: "Fifth", value: "fifth" },
  //   ])
  //
  // const text = new TextInputComponent()
  //   .setCustomId('questionTextInput')
  //   .setLabel("What is the question?")
  //   .setStyle('PARAGRAPH');
  //
  // const choices = new TextInputComponent()
  //   .setCustomId('questionChoicesInput')
  //   .setLabel("(Optional) Choices, seperated by commas")
  //   .setStyle('SHORT');

  // const role = new TextInputComponent()
  //   .setCustomId('hobbiesInput')
  //   .setLabel("What's some of your favorite hobbies?")
  //   // Paragraph means multiple lines of text.
  //   .setStyle('PARAGRAPH');

  // const firstActionRow = new MessageActionRow().addComponents(orderPicker);
  // const secondActionRow = new MessageActionRow().addComponents(text);
  // const thirdActionRow = new MessageActionRow().addComponents(choices)
  //
  // modal.addComponents(firstActionRow, secondActionRow, thirdActionRow);
  // await interaction.showModal(modal);

  await interaction.deferReply();
  const reply = await interaction.editReply("Fetching questions...");

  const {options} = interaction;
  const order = options.getInteger("order");
  const text = options.getString("text");
  const choices = options.getString("choices");
  const answerLength = options.getString("answer-length");
  const role = options.getRole("role");

  if(text.length > 45){
    await interaction.editReply(`Please shorten your question to 45 characters by removing at least ${text.length - 18} characters.`);
    Logger.log(`[edit-question] ${interaction.member.displayName} failed to set question due to length`);
    return
  }

  questions.set(order.toString(), {
    order,
    text,
    choices,
    answerLength,
    roleId: role?.id
  });

  await interaction.editReply(`Question saved! \n(${order}) ${text} ${choices ? `\nChoices: [${choices}]` : ""} ${role ? `\nRole: ${role.name}` : ""}`);
  Logger.log(`[edit-question] ${interaction.member.displayName} edited question #${order}: ${text} (${choices}) [${role?.name}]`);

  // todo: how to delete question?
};

exports.commandData = {
  name: "edit-question",
  description: "Edit a recruiter feedback session question ",
  options: [
    {
      name: "order",
      description: "The order in which the question will be asked. Required.",
      required: true,
      type: Constants.ApplicationCommandOptionTypes.INTEGER
    },
    {
      name: "text",
      description: "The question itself, 45 characters max. Required.",
      required: true,
      type: Constants.ApplicationCommandOptionTypes.STRING
    },
    // {
    //   name: "choices",
    //   description: "Comma-separated choices for this question. Optional.",
    //   required: false,
    //   type: Constants.ApplicationCommandOptionTypes.STRING
    // },
    {
      name: "answer-length",
      description: "How long the expected response is",
      required: true,
      choices: [
        { name: "One line", value: "SHORT" },
        { name: "Paragraph", value: "PARAGRAPH" },
      ],
      type: Constants.ApplicationCommandOptionTypes.STRING
    },
    {
      name: "role",
      description: "If this question is specific to any given roles.  Optional.",
      required: false,
      type: Constants.ApplicationCommandOptionTypes.ROLE
    }
  ],
  defaultPermission: true,
};

// TODO: set guildOnly to true for this command
exports.conf = {
  permLevel: "Moderator",
  guildOnly: false
};