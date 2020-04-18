import firebase from "firebase";
import 'firebase/firestore';

firebase.initializeApp({
    apiKey: "AIzaSyA-LcxEpTeXYgKSLziNQYMV3s1-LeU-mrc",
    databaseURL: "https://firestore-serializer.firebaseio.com",
    projectId: "firestore-serializer",
    appId: "1:713937975677:web:20bc5eb2de1cf56fd63414"
});

export async function initFirebase() {
    const documents = [
        { id: 'simple', a: 'b' },
        { id: 'timestamp', a: firebase.firestore.Timestamp.fromDate(new Date()) },
        { id: 'geopoint', a: new firebase.firestore.GeoPoint(10, 10) },
        { id: 'geopoint-with-float', a: new firebase.firestore.GeoPoint(2.3294, 34.224) },
        { id: 'geopoint-with-negative-float', a: new firebase.firestore.GeoPoint(2.314, -32.443) },
        { id: 'document-reference', a: firebase.firestore().collection('documents').doc('simple') },
        {
            id: 'multiple',
            a: 'b',
            b: firebase.firestore.Timestamp.fromDate(new Date()),
            c: new firebase.firestore.GeoPoint(4.3234, -2.234),
            d: firebase.firestore().collection('documents').doc('simple')
        },
        {
            id: 'nested',
            a: 'b',
            b: {
                c: firebase.firestore.Timestamp.fromDate(new Date()),
                d: {
                    e: [
                        new firebase.firestore.GeoPoint(3.43, -3.445),
                        firebase.firestore().collection('documents').doc('simple')
                    ]
                }
            }
        }
    ];

    const batch = firebase.firestore().batch();

    documents.forEach(e => {
        batch.set(
            firebase.firestore().collection('documents').doc(e.id),
            e
        );
    });

    await batch.commit();
}