// Make sure correct version of node is used
if (Number(process.version.slice(1).split(".")[0]) < 8) throw new Error("Node 8.0.0 or higher is required. Update Node on your system.");

// Imports for bot
const Discord = require("discord.js");
const { promisify } = require("util");
const readdir = promisify(require("fs").readdir);
const Enmap = require("enmap");
const config = require("./config.js")

// Imports for google
const backend = require('./backend')
// const fs = require('fs')
// const { google } = require('googleapis');



// Initialize the bot
// const client = new Discord.Client();
const client = new Discord.Client({
  ws: {
    intents: config.intents
  }
});

// Here we load the config file that contains our token and our prefix values.
client.config = config;

// Load the logger
client.logger = require("./modules/Logger");

// adding some useful functions to the client
require("./modules/functions.js")(client);

// Aliases and commands are put in collections where they can be read from,
// catalogued, listed, etc.
client.commands = new Enmap();
client.aliases = new Enmap();

// Now we integrate the use of Evie's awesome EnMap module, which
// essentially saves a collection to disk. This is great for per-server configs,
// and makes things extremely easy for this purpose.
client.settings = new Enmap({ name: "settings" });

// function to initialize the discord bot
const initDiscord = async () => {

  // Here we load **commands** into memory, as a collection, so they're accessible here and everywhere else.
  const cmdFiles = await readdir("./commands/");
  client.logger.log(`Loading a total of ${cmdFiles.length} commands.`);
  cmdFiles.forEach(f => {
    if (!f.endsWith(".js")) return;
    const response = client.loadCommand(f);
    if (response) console.log(response);
  });

  // Then we load events, which will include our message and ready event.
  const evtFiles = await readdir("./events/");
  client.logger.log(`Loading a total of ${evtFiles.length} events.`);
  evtFiles.forEach(file => {
    const eventName = file.split(".")[0];
    client.logger.log(`Loading Event: ${eventName}`);
    const event = require(`./events/${file}`);
    // Bind the client to any event, before the existing arguments
    client.on(eventName, event.bind(null, client));
  });

  // Generate a cache of client permissions for pretty perm names in commands.
  client.levelCache = {};
  for (let i = 0; i < client.config.permLevels.length; i++) {
    const thisLevel = client.config.permLevels[i];
    client.levelCache[thisLevel.name] = thisLevel.level;
  }

  // Here we login the client.
  client.login(client.config.token);


};  // End top-level async/await function.

// startup Google sheets backend
const initGoogle = async () => {

  try {
    // get the pre-authorized spreadsheet object.  shape: {recruits, feedback}
    let doc = await backend.loadBackend()

    // adding pre-authorized google sheet reference to the client
    client.spreadsheet = doc
    client.recruitSheet = doc.recruits
    client.feedbackSheet = doc.feedback
    client.logger.log("Authorized with Google's API.", 'ready')

  } catch (e) {
    client.logger.log("Error authenticating Google:", e)
  }

  // some bot settings
  // client.recruiterRole = '742269038927020153'                          // The role ID for Recruiters (manbear dev)
  // client.botChannelId = '932185798365835277'                           // The text channel where the bot listens for commands (manbear dev)
  client.recruiterRole = '745442248988164227'                             // The role ID for Recruiters (ksx)
  client.botChannelId = '752656919298310155'                              // The text channel where the bot listens for commands (ksx)
  client.ignoredChannels = new Enmap({name: "ignoredChannels"})           // for holding voice channels ignored by the bot
  client.feedback = { totals: {total: 0, timedOut: 0, skipped: 0, success: 0 }}  // For bot stats, resets when bot restarts
  client.recruitInVoiceMessages = {}                                      // This is used for keeping track of message objects to be edited as recruits leave voice.
  client.feedbackQueue = {}                                               // The currently queued up feedback requests


}

// Setup Sentry
const Sentry = require("@sentry/node");
// or use es6 import statements
// import * as Sentry from '@sentry/node';

const Tracing = require("@sentry/tracing");
// or use es6 import statements
// import * as Tracing from '@sentry/tracing';

// UNCOMMIT TO RESTART SENTRY
Sentry.init({
  dsn: "https://7fe31fefbdca4468bfe3a4982a831a6e@o491578.ingest.sentry.io/5557365",

  // We recommend adjusting this value in production, or using tracesSampler
  // for finer control
  tracesSampleRate: 1.0,
});

const transaction = Sentry.startTransaction({
  op: "test",
  name: "My First Test Transaction",
});

setTimeout(() => {
  try {
    foo();
  } catch (e) {
    Sentry.captureException(e);
  } finally {
    transaction.finish();
  }
}, 99);



// startup Google Sheets backend. 
initGoogle()
// startup Discord bot frontend
initDiscord()

