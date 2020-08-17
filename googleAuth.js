const { JWT } = require('google-auth-library');

function authorize() {
    return new Promise(async resolve => {
        const client = new JWT({
            key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
            email: process.env.GOOGLE_CLIENT_EMAIL,
            scopes: ['https://www.googleapis.com/auth/spreadsheets']
        });

        const url = `https://dns.googleapis.com/dns/v1/projects/${process.env.GOOGLE_PROJECT_ID}`;
        const res = await client.request({url});
        resolve(res.data)
    });
}

module.exports = {
    authorize,
}