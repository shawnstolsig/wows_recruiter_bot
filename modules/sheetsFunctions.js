/**
 * This function takes in the bot client and returns an array of the existing recruits from Google Sheets
 */
const getCurrentRecruits = async (client) => {

    // create array for holding the existing recruit IDs
    let existingRecruits = {}

    try {
        // get existing recruits.  start at the second row to ignore the headers
        await client.recruitSheet.loadCells('A2:E')

        // iterate through non-empty cells, starting at the second row to ignore headers
        let row = 1
        while (client.recruitSheet.getCell(row, 0).value && row < 5000) {     // adding a max upper limit for row just to prevent any possible infinite loop

            // add a prop to existingRecruis.  key is the id of the player, value is an object with their details
            existingRecruits[client.recruitSheet.getCell(row, 1).value] = {
                id: client.recruitSheet.getCell(row, 1).value,
                name: client.recruitSheet.getCell(row, 0).value,
                dateAdded: client.recruitSheet.getCell(row, 2).formattedValue,
                dateCompleted: client.recruitSheet.getCell(row, 3).formattedValue,
                voiceSessionCount: client.recruitSheet.getCell(row, 4).value,
                row,
            }
            row++
        }

    } catch (e) {
        client.logger.log("Error in getCurrentRecruits " + e, 'error')
    }

    return existingRecruits

}

/**
 * A function to get all of the feedback.  This will be passed in to addFeedbackToQueue to 
 * help prevent same-day feedback
 */
const getAllFeedback = async (client) => {
    let feedback = []

    try {
        await client.feedbackSheet.loadCells('A2:G')

        // iterate through non-empty cells, starting at the second row to ignore headers
        let row = 1
        while (client.feedbackSheet.getCell(row, 0).value && row < 5000) {     // adding a max upper limit for row just to prevent any possible infinite loop

            // add nested array representing that row
            feedback.push([
                client.feedbackSheet.getCell(row, 0).value,
                client.feedbackSheet.getCell(row, 1).value,
                client.feedbackSheet.getCell(row, 2).value,
                client.feedbackSheet.getCell(row, 3).value,
                client.feedbackSheet.getCell(row, 4).formattedValue,    // the date
                client.feedbackSheet.getCell(row, 5).value,
                client.feedbackSheet.getCell(row, 6).value,
            ])
            row++
        }
    } catch (e) {
        client.logger.log("Error in getAllFeedback " + e, 'error')
    }

    return feedback
}

module.exports = {
    getCurrentRecruits,
    getAllFeedback
}