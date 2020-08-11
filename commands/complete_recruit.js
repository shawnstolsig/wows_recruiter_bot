exports.run = async (client, message, args, level) => { // eslint-disable-line no-unused-vars

	// give immediate feedback that recruit is being added
	const msg = await message.channel.send("Completing recruit...");

	// get a collection of the guild's users
	let users = await message.guild.members.fetch()

	// try to find the guild member based on user's input to the add_recruit command
	let userName
	if(args.length > 1){
		// Discord only allows single spaces between words in nickname
		userName = args.join(' ')
	} else {
		userName = args[0]
	}

	let recruit = users.find(user => {
		// if user has a username, then use that.  otherwise, use their displayName
		if(user.nickname){
			return user.nickname === userName
		}
		return user.displayName === userName
		
	})			

	// HANDLE IF MULTIPLE USERS WITH SAME NICKNAME?

	// if a guild member was found
	if (recruit) {

		// get existing recruits
		client.sheet.spreadsheets.values.get({
			spreadsheetId: client.spreadsheetId,
			range: 'Recruits!A2:E'
		}, (err, result) => {
			// handle error
			if (err) {
				client.logger.log(`Unable to get recruits from Google Sheet: ` + err, 'error');
			}
			// handle the list of recruits
			else {
				let existingRecruits = []
				// check to make sure recruits were returned.  if recruits are empty, we can't call .map
				if (result.data.values) {
					result.data.values.map((row) => existingRecruits.push(row[1]))
				}

				// if recruit is not already on recruit list, update message
				let recruitIndex = existingRecruits.indexOf(recruit.id)
				if (recruitIndex === -1) {
					msg.edit(`${recruit.displayName} is not a recruit.  Please use 'add_recruit' command to add!`)
					// msg.edit(`${recruit.displayName} was added as a recruit on ${result.data.values[i][2]}. No changes have been made.`)
				}

				// if recruit is on list
				else {

					// if recruit has already been completed, update message
					let removedDate = result.data.values[recruitIndex][3]
					if (removedDate) {
						msg.edit(`${recruit.displayName} was already marked as complete on ${removedDate}. No changes have been made.`)
					}

					// if recruit not already completed, mark as complete
					else {
						// append recruit to list, guide at https://developers.google.com/sheets/api/guides/values
						// create new cell value arrays/objects.  elements of outer array are rows, elements of inner array are cells
						let dateCompleted = new Date()
						let values = [[dateCompleted.toLocaleDateString()]];
						let resource = {
							values,
						};

						// append new recruit to google sheet
						client.sheet.spreadsheets.values.update({
							spreadsheetId: client.spreadsheetId,
							range: `Recruits!D${recruitIndex + 2}`,
							valueInputOption: 'USER_ENTERED',
							resource,
						}, (err, result) => {
							// handle errors
							if (err) {
								client.logger.log(err, 'error');
								msg.edit(`Unable to remove recruit to Google sheet.`)
							}
							// print success message
							else {
								msg.edit(`${recruit.displayName} marked as completed!`);
							}
						});
					}
				}
			}
		})
	}
	// if unable to find guild member based on input username
	else {
		msg.edit('Unable to find Discord user.')
	}
};

exports.conf = {
	enabled: true,
	guildOnly: false,
	aliases: ['complete'],
	permLevel: "User"
};

exports.help = {
	name: "complete_recruit",
	category: "Recruiting",
	description: "A command to mark a potential recruit as 'completed'. ",
	usage: "complete_recruit <name>"
};
