const functions = require("firebase-functions");
const admin = require('firebase-admin');
admin.initializeApp({projectId: 'fstack23'})

exports.authTriggeredFunction = functions.auth
    .user()
    .onCreate((user, context) => {
        admin.firestore().collection('user').doc(user.uid)
            .set({
                name: user.displayName
            })
    })

exports.firestoreTriggeredFunction = functions.firestore
    .document('chat/{document}')
    .onCreate((snapshot, context) => {

    })