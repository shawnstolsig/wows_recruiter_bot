exports.run = async (client, message, args, level) => { // eslint-disable-line no-unused-vars

	// give immediate feedback that recruit is being added
	const msg = await message.channel.send("Adding recruit...");

	// get a collection of the guild's users
	let users = await message.guild.members.fetch()

	// try to find the guild member based on user's input to the add_recruit command
	let recruit = users.find(user => user.displayName === args[0])

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

				// if recruit is already on recruit list, update message
				let i = existingRecruits.indexOf(recruit.id)
				if (i !== -1) {
					msg.edit(`${recruit.displayName} was added as a recruit on ${result.data.values[i][2]}. No changes have been made.`)
				}

				// if recruit is not on list
				else {
					// append recruit to list, guide at https://developers.google.com/sheets/api/guides/values
					// create new cell value arrays/objects.  elements of outer array are rows, elements of inner array are cells
					let dateAdded = new Date()
					let values = [[recruit.displayName, recruit.id, dateAdded.toLocaleDateString()]];
					let resource = {
						values,
					};

					// append new recruit to google sheet
					client.sheet.spreadsheets.values.append({
						spreadsheetId: client.spreadsheetId,
						range: 'Recruits',
						valueInputOption: 'USER_ENTERED',
						resource,
					}, (err, result) => {
						// handle errors
						if (err) {
							client.logger.log(err, 'error');
							msg.edit(`Unable to add recruit to Google sheet.`)
						}
						// print success message
						else {
							msg.edit(`${recruit.displayName} added as a potential recruit!`);
						}
					});
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
	aliases: ['add'],
	permLevel: "User"
};

exports.help = {
	name: "add_recruit",
	category: "Recruiting",
	description: "A command to add a user to the recruiting list.",
	usage: "add_recruit <name>"
};
