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
  const questionNumber = options.getInteger("question-number");

  const question = questions.get(questionNumber)

  if(!question){
    await interaction.editReply(`Question ${questionNumber} wasn't configured...no change made. Please use ${bold('/show-questions')} command to see current question configuration`);
    Logger.log(`[clear-question] ${interaction.member.displayName} tried to clear question ${questionNumber} but it did not exist`);
    return
  }

  questions.delete(questionNumber)
  await interaction.editReply(`Question cleared! Please use ${bold('/show-questions')} command to see current question configuration`);
  Logger.log(`[clear-question] ${interaction.member.displayName} cleared question ${questionNumber}: ${question.text}`);

};

exports.commandData = {
  name: "clear-question",
  description: "Clear a recruiter feedback session question ",
  options: [
    {
      name: "question-number",
      description: "The question number to be cleared. Required.",
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
  ],
  defaultPermission: true,
};

exports.conf = {
  permLevel: "Administrator",
  guildOnly: true
};