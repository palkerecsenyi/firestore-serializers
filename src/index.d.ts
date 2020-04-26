import {firestore} from 'firebase';

declare function serializeDocumentSnapshot(
    documentSnapshot: firestore.DocumentSnapshot
): string;

declare function serializeQuerySnapshot(
    querySnapshot: firestore.QuerySnapshot
): string;

declare function deserializeDocumentSnapshot<T = firestore.DocumentData>(
    input: string,
    firestore: firestore.Firestore
): firestore.DocumentSnapshot<T>;

declare function deserializeDocumentSnapshotArray<T = firestore.DocumentData>(
    input: string,
    firestore: firestore.Firestore
): firestore.DocumentSnapshot<T>[];