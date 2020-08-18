const { getCurrentRecruits } = require('../modules/sheetsFunctions')
const { getName } = require('../modules/discordFunctions')

exports.run = async (client, message, args, level) => { // eslint-disable-line no-unused-vars

    // give immediate feedback that recruit is being added
    const msg = await message.channel.send("Getting all active recruits...");

    // get existing recruits
    let existingRecruits = await getCurrentRecruits(client)

    // get array of active recruit ids
    let activeRecruitIds = []
    for(const id in existingRecruits){
        if(!existingRecruits[id].dateCompleted){
            activeRecruitIds.push(id)
        }
    }

    // if there are no active recruits
    if (activeRecruitIds.length === 0) {
        msg.edit("There are no active recruits.")
    }

    //if there are active recruits
    else {
        let activeRecruitsMessage = `Active recruits:\n`
        for (const id of activeRecruitIds) {
            activeRecruitsMessage = activeRecruitsMessage.concat(`${existingRecruits[id].name} - ${existingRecruits[id].dateAdded}\n`)
        }
        msg.edit(activeRecruitsMessage)
    }
};

exports.conf = {
    enabled: true,
    guildOnly: false,
    aliases: ['get'],
    permLevel: "User"
};

exports.help = {
    name: "get_recruits",
    category: "Recruiting",
    description: "A command to get a list of all active recruits.",
    usage: "get_recruits"
};
