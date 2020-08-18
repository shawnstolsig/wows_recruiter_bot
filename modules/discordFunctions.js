/**
 * This function will take in a GuildMember object and return a string name (either the
 * nickname, if it's not null, or the displayName)
 */
exports.getName = (member) => {
    if(member.nickname){
        return member.nickname
    } 
    return member.displayName
}

exports.getDiscordMember = async (message, args) => {
    // get a collection of the guild's members
	let members = await message.guild.members.fetch()

	// try to find the guild member based on user's input
	let userName
	if (args.length > 1) {
		// Discord only allows single spaces between words in nickname, so rejoin words if the username has spaces
		userName = args.join(' ')
	} else {
        // if no spaces, just take the first string
		userName = args[0]
	}

    // get the user from the Guild's members
	let user = members.find(user => {
		// if user has a username, then use that.  otherwise, use their displayName
		if (user.nickname) {
			return user.nickname === userName
		}
		return user.displayName === userName
	})

	// HANDLE IF MULTIPLE USERS WITH SAME NICKNAME?

	// abort if guild member not found
	if (!user) {
		return false
	} else {
        return user
    }
}