const { getCurrentRecruits } = require('../modules/sheetsFunctions')
const { getName, getDiscordMember } = require('../modules/discordFunctions')

exports.run = async (client, message, args, level) => { // eslint-disable-line no-unused-vars

	// give immediate feedback that recruit is being added
	const msg = await message.channel.send("Adding recruit...");

	// get recruit 
	let recruit = await getDiscordMember(msg, args)

	// abort if guild member not found
	if (!recruit) {
		msg.edit('Unable to find Discord user.')
		return
	}

	// get exising recruits
	let existingRecruits = await getCurrentRecruits(client)

	// if recruit is already on recruit list, update message
	if (existingRecruits[recruit.id]) {
		msg.edit(`${existingRecruits[recruit.id].name} was added as a recruit on ${existingRecruits[recruit.id].dateAdded}. No changes have been made.`)
	}

	// if not already a recruit
	else {

		// add row to the Recruit sheet
		let dateAdded = new Date()
		let recruitName = getName(recruit)
		client.recruitSheet.addRow([recruitName, recruit.id, dateAdded.toLocaleDateString()])
			.then(() => {
				client.logger.log(`${recruitName} added as recruit. `)
				msg.edit(`${recruitName} is now being tracked as a recruit!`);
			})
			.catch((err) => {
				client.logger.log(err, 'error');
				msg.edit(`Unable to add recruit to Google sheet.`)
			})
	}
}


exports.conf = {
	enabled: true,
	guildOnly: false,
	aliases: ['add'],
	permLevel: "Discord Admin"
};

exports.help = {
	name: "add_recruit",
	category: "Recruiting",
	description: "A command to add a user to the recruiting list.",
	usage: "add_recruit <name>"
};
