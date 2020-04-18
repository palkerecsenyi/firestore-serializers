import firebase from "firebase";
import 'firebase/firestore';
import {SimpleJsonType} from "./types";

function objectifyDocument(partialObject: {
    [key: string]: SimpleJsonType
}): firebase.firestore.DocumentSnapshot {
}

export function deserializeDocumentSnapshotArray(string: string): firebase.firestore.DocumentSnapshot[] {

}

export function deserializeDocumentSnapshot(string: string): firebase.firestore.DocumentSnapshot {
    return objectifyDocument(JSON.parse(string));
}