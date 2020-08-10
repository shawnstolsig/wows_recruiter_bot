exports.run = async (client, message, args, level) => { // eslint-disable-line no-unused-vars

	// give immediate feedback that recruit is being added
	const msg = await message.channel.send("Getting recruit info...");

	// get a collection of the guild's users
	message.guild.members.fetch().then((users) => {

		// try to find the user input to the add_recruit command
		let foundUser = users.find(user => user.displayName === args[0])

		// update message depending on result
		if (foundUser) {

            // more here, once you have the desired recruit's ID, then lookup in client.sheet
	
		} else {
			msg.edit('Unable to find user.')
		}


	})



};

exports.conf = {
	enabled: true,
	guildOnly: false,
	aliases: ['get'],
	permLevel: "User"
};

exports.help = {
	name: "get_recruit",
	category: "Recruiting",
	description: "A command to get a recruit's information.",
	usage: "get_recruit <name>"
};


// // 
// client.sheet.spreadsheets.values.get({
//     spreadsheetId: '16WSuKOnRbsIomv3QY9ovcK2W2JmPqcytPR5Wr6XQqgc',
//     range: 'Recruiter Bot!A1:B2',
// }, (err, res) => {
//     if (err) return console.log('The API returned an error: ' + err);
//     const rows = res.data.values;
//     if (rows.length) {
//         // Print columns A and B, which correspond to indices 0 and 4.
//         rows.map((row) => {
//             client.logger.log(`${row[0]}, ${row[1]}`);
//         });
//     } else {
//         client.logger.log('No data found.');
//     }
// });
