const { getCurrentRecruits } = require('../modules/sheetsFunctions')
const { getName, getDiscordMember } = require('../modules/discordFunctions')

exports.run = async (client, message, args, level) => { // eslint-disable-line no-unused-vars

	// give immediate feedback that recruit is being added
	const msg = await message.channel.send("Checking for recruit info...");

	// get recruit 
	let recruit = await getDiscordMember(msg, args)

	// if a guild member was found
	if (!recruit) {
		msg.edit('Unable to find Discord user.')
		return
	}

	// store the name we want to display for the recruit
	let recruitName = getName(recruit)

	// get exising recruits
	let existingRecruits = await getCurrentRecruits(client)
	let thisRecruit = existingRecruits[recruit.id]

	// if recruit is already on recruit list, update message
	if (!thisRecruit) {
		msg.edit(`${recruitName} is not a recruit.`)
	} else {
		if(thisRecruit.dateCompleted){
			msg.edit(`${recruitName} has completed recruiting.  They were added as a recruit on ${thisRecruit.dateAdded} and completed on ${thisRecruit.dateCompleted} `)
		} else {
			msg.edit(`${recruitName} is an active recruit.  They were added as a recruit on ${thisRecruit.dateAdded}. `)
		}
	}
};

exports.conf = {
	enabled: true,
	guildOnly: false,
	aliases: ['check'],
	permLevel: "User"
};

exports.help = {
	name: "check_recruit",
	category: "Recruiting",
	description: "A command to get a recruit's information.",
	usage: "check_recruit <name>"
};
