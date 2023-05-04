const functions = require("firebase-functions");
const admin = require('firebase-admin');
admin.initializeApp({projectId: 'fstack23'})

const app = require('express')();
const cors = require('cors');
app.use(cors());

const toxicity = require('@tensorflow-models/toxicity');

const validateFirebaseIdToken = async (req, res, next) => {
    try {
        const token = req.headers?.authorization;
        await admin.auth().verifyIdToken(token);
        return next();
    } catch (error) {
        return res.status(403).json(error);
    }
}

const isThisMessageAllRight = async (message) => {
    const model = await toxicity.load(0.9);
    const predicions = await model.classify(message);
    let whatsWrongWithMessage = [];

    predicions.forEach(prediction => {
        prediction.results.forEach(result => {
            if (result.match) {
                whatsWrongWithMessage.push(prediction.label);
            }
        })
    })
    return whatsWrongWithMessage;
}

app.post('/message', validateFirebaseIdToken, async (req, res) => {
    const body = req.body;
    const result = await isThisMessageAllRight(body.messageContent);

    if(result.length===0) {
        const writeresult =
            await admin.firestore().collection('chat')
                .doc(body.id)
                .set(body);
        return res.status(201).json(writeresult);
    }
    return res.status(400).json(
        {
            message: "you're being toxic",
            results: result
        }
    )
})


exports.api = functions.https.onRequest(app);

