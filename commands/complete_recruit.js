const { getCurrentRecruits } = require('../modules/sheetsFunctions')
const { getName, getDiscordMember } = require('../modules/discordFunctions')

exports.run = async (client, message, args, level) => { // eslint-disable-line no-unused-vars

	// give immediate feedback that recruit is being added
	const msg = await message.channel.send("Completing recruit...");

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
		msg.edit(`${recruitName} is not a recruit.  Please use 'add_recruit' command to add!`)
	}

	// if not already a recruit
	else {

		// if the recruit has already been completed, update message
		if(thisRecruit.dateCompleted){
			msg.edit(`${recruitName} was already completed on ${thisRecruit.dateCompleted}`)
			return
		}


		// add row to the Recruit sheet
		let dateCompleted = new Date()

		// add the completion date to the sheet
		let completedDateCell = client.recruitSheet.getCell(thisRecruit.row, 3)
		completedDateCell.value = dateCompleted.toLocaleDateString()

		// save changes to google
		client.recruitSheet.saveUpdatedCells()
			.then(() => {
				client.logger.log(`${recruitName} marked as completed!`)
				msg.edit(`${recruitName} marked as completed!`);
			})
			.catch((err) => {
				client.logger.log(err, 'error');
				msg.edit(`Unable to complete recruit on Google sheet.`)
			})
	}
}


exports.conf = {
	enabled: true,
	guildOnly: false,
	aliases: ['complete'],
	permLevel: "Discord Admin"
};

exports.help = {
	name: "complete_recruit",
	category: "Recruiting",
	description: "A command to mark a potential recruit as 'completed'. ",
	usage: "complete_recruit <name>"
};
