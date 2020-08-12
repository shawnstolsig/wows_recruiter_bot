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