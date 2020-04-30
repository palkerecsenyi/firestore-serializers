import firebase from 'firebase';

declare function serializeDocumentSnapshot(
    documentSnapshot: firebase.firestore.DocumentSnapshot
): string;

declare function serializeQuerySnapshot(
    querySnapshot: firebase.firestore.QuerySnapshot
): string;

declare function deserializeDocumentSnapshot<T = firebase.firestore.DocumentData>(
    input: string,
    firestore: firebase.firestore.Firestore,
    geoPoint: typeof firebase.firestore.GeoPoint,
    timestamp: typeof firebase.firestore.Timestamp
): firebase.firestore.DocumentSnapshot<T>;

declare function deserializeDocumentSnapshotArray<T = firebase.firestore.DocumentData>(
    input: string,
    firestore: firebase.firestore.Firestore,
    geoPoint: typeof firebase.firestore.GeoPoint,
    timestamp: typeof firebase.firestore.Timestamp
): firebase.firestore.DocumentSnapshot<T>[];
