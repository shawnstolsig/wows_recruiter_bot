const { GoogleSpreadsheet } = require('google-spreadsheet');
require('dotenv').config();

const loadBackend = async () => {
    // update the spreadsheet ID when moving to Google sheet that is used for production
    const doc = new GoogleSpreadsheet('16WSuKOnRbsIomv3QY9ovcK2W2JmPqcytPR5Wr6XQqgc');

    // use service account creds
    await doc.useServiceAccountAuth({
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    });

    await doc.loadInfo(); // loads document properties and worksheets
    console.log(doc.title);
    await doc.updateProperties({ title: 'renamed title' });

}

