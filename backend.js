const { GoogleSpreadsheet } = require('google-spreadsheet');
require('dotenv').config();

// globals to change when moving to production
const SPREADSHEET_ID = '16WSuKOnRbsIomv3QY9ovcK2W2JmPqcytPR5Wr6XQqgc'
const RECRUIT_SHEET_ID = '1599491541'
const FEEDBACK_SHEET_ID = '1285613492'

const loadBackend = async () => {
    // update the spreadsheet ID when moving to Google sheet that is used for production
    const doc = new GoogleSpreadsheet(SPREADSHEET_ID);

    // use service account creds
    await doc.useServiceAccountAuth({
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    });

    await doc.loadInfo()

    return {recruits: doc.sheetsById[RECRUIT_SHEET_ID], feedback: doc.sheetsById[FEEDBACK_SHEET_ID]}
}

module.exports = {
    loadBackend,
}