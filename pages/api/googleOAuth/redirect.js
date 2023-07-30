import { google } from 'googleapis'
import fs from 'fs'
import path from 'path'


const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URL
)

export default async function handler(req, res) {
    const code = req.query.code;
    console.log("HIIIII!")

    const { tokens } = await oauth2Client.getToken(code)
    oauth2Client.setCredentials(tokens)

    fs.writeFileSync(path.resolve('./refreshToken.txt'), tokens.refresh_token )

    console.log("hi")

    res.setHeader('Location', '/calendar');
    res.statusCode = 302;
    res.end();


    // res.send({
    //     msg: "You have logged in"
    // })

    // window.location.href='/calendar'

    //res.json(token)

}