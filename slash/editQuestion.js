const {
  Constants,
} = require("discord.js");

const Logger = require("../modules/logger");
const {questions} = require("../modules/enmaps");
const {bold} = require("../modules/functions");

exports.run = async (client, interaction) => { // eslint-disable-line no-unused-vars

  await interaction.deferReply();
  const reply = await interaction.editReply("Fetching questions...");

  const {options} = interaction;
  const order = options.getInteger("order");
  const text = options.getString("text");
  const choices = options.getString("choices");
  const answerLength = options.getString("answer-length");
  const role = options.getRole("role");

  if(text.length > 100){
    await interaction.editReply(`Please shorten your question to 100 characters by removing at least ${text.length - 100} characters.`);
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
};

exports.commandData = {
  name: "edit-question",
  description: "Edit a recruiter feedback session question ",
  options: [
    {
      name: "order",
      description: "The order in which the question will be asked. Required.",
      required: true,
      type: Constants.ApplicationCommandOptionTypes.INTEGER,
      choices: [
        { name: "Question #1", value: 1},
        { name: "Question #2", value: 2},
        { name: "Question #3", value: 3},
        { name: "Question #4", value: 4},
        { name: "Question #5", value: 5},
      ]
    },
    {
      name: "text",
      description: "The question...100 characters max. Required.",
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
      description: "How long the expected response is.",
      required: true,
      choices: [
        { name: "One line", value: "SHORT" },
        { name: "Paragraph", value: "PARAGRAPH" },
      ],
      type: Constants.ApplicationCommandOptionTypes.STRING
    },
    {
      name: "role",
      description: "If this question is specific to any given roles. Optional.",
      required: false,
      type: Constants.ApplicationCommandOptionTypes.ROLE
    }
  ],
  defaultPermission: true,
};

exports.conf = {
  permLevel: "Moderator",
  guildOnly: true
};