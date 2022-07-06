if (Number(process.version.slice(1).split(".")[0]) < 16) throw new Error("Node 16.x or higher is required. Update Node on your system.");

/**********************************************************************************************************************
 * Imports
 * ********************************************************************************************************************/
require("dotenv").config();
const { GoogleSpreadsheet } = require('google-spreadsheet');
const { Client, Collection } = require("discord.js");
const { readdirSync } = require("fs");
const { intents, partials, permLevels } = require("./config.js");
const logger = require("./modules/logger.js");
const { googleSync } = require("./modules/functions");
const Sentry = require("@sentry/node");
const Tracing = require("@sentry/tracing");

/**********************************************************************************************************************
 * SENTRY
 * ********************************************************************************************************************/

// TODO: UNCOMMENT TO ENABLE SENTRY BEFORE PRODUCTION

// Sentry.init({
//   dsn: "https://7fe31fefbdca4468bfe3a4982a831a6e@o491578.ingest.sentry.io/5557365",
//   tracesSampleRate: 1.0,
// });
//
// const transaction = Sentry.startTransaction({
//   op: "startup",
//   name: "Startup",
// });
//
// setTimeout(() => {
//   try {
//     foo();
//   } catch (e) {
//     Sentry.captureException(e);
//   } finally {
//     transaction.finish();
//   }
// }, 99);

/**********************************************************************************************************************
 * Guidebot
 * ********************************************************************************************************************/
const client = new Client({ intents, partials });

const commands = new Collection();
const aliases = new Collection();
const slashcmds = new Collection();

// Generate a cache of client permissions for pretty perm names in commands.
const levelCache = {};
for (let i = 0; i < permLevels.length; i++) {
  const thisLevel = permLevels[i];
  levelCache[thisLevel.name] = thisLevel.level;
}

// To reduce client pollution we'll create a single container property that we can attach everything we need to.
client.container = {
  commands,
  aliases,
  slashcmds,
  levelCache
};

const init = async () => {

  // Here we load **commands** into memory, as a collection, so they're accessible here and everywhere else.
  const commands = readdirSync("./commands/").filter(file => file.endsWith(".js"));
  for (const file of commands) {
    const props = require(`./commands/${file}`);
    logger.log(`Loading Command: ${props.help.name}. 👌`, "log");
    client.container.commands.set(props.help.name, props);
    props.conf.aliases.forEach(alias => {
      client.container.aliases.set(alias, props.help.name);
    });
  }

  // Now we load any **slash** commands you may have in the ./slash directory.
  const slashFiles = readdirSync("./slash").filter(file => file.endsWith(".js"));
  for (const file of slashFiles) {
    const command = require(`./slash/${file}`);
    const commandName = file.split(".")[0];
    logger.log(`Loading Slash command: ${commandName}. 👌`, "log");
    
    // Now set the name of the command with it's properties.
    client.container.slashcmds.set(command.commandData.name, command);
  }

  // Then we load events, which will include our message and ready event.
  const eventFiles = readdirSync("./events/").filter(file => file.endsWith(".js"));
  for (const file of eventFiles) {
    const eventName = file.split(".")[0];
    logger.log(`Loading Event: ${eventName}. 👌`, "log");
    const event = require(`./events/${file}`);

    // Bind the client to any event, before the existing arguments provided by the discord.js event.
    client.on(eventName, event.bind(null, client));
  }  

  // This event will fire when a thread is created, if you want to expand the logic, throw this in it's own event file like the rest.
  client.on("threadCreate", (thread) => thread.join());

  // Here we login the client.
  client.login();

  // Create Google spreadsheet client
  const doc = new GoogleSpreadsheet(process.env.SPREADSHEET_ID);

  await doc.useServiceAccountAuth({
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  });

  await doc.loadInfo()
  client.container.google = {}
  client.container.google.recruitSheet = doc.sheetsById[process.env.RECRUIT_SHEET_ID]
  client.container.google.feedbackSheet = doc.sheetsById[process.env.FEEDBACK_SHEET_ID]
  logger.log(`Connected to Google Sheet: ${doc.title}`, "ready");

// End top-level async/await function.
};

// add some constants to the client container
client.container.constants = {
  // todo: change these to 10 min, 24 hrs
  MIN_VOICE_CONNECTION_TIME: .1,
  MIN_HOURS_BETWEEN_VOICE_SESSIONS: 24
}

// start Discord bot client
init();

// cronjob for updating Google sheets
const CronJob = require('cron').CronJob;
const googleSyncCron = new CronJob(
  '* * * * *',
  googleSync,
  null,
  true,
  'America/Los_Angeles'
);
