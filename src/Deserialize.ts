import firebase from "firebase";
import {SimpleJsonType} from "./types";
import {mapDeepWithArrays, UnmappedData} from "./map-deep-with-arrays";
import { get, isEqual, omit } from "lodash";

function objectifyDocumentProperty(
    item: string,
    firestore: firebase.firestore.Firestore
): any {
    let modifiedItem: any = item;

    if(item.startsWith('__DocumentReference__')) {
        const path = item.split('__DocumentReference__')[1];
        modifiedItem = firestore.doc(path);
    }

    if(item.startsWith('__Timestamp__')) {
        const dateString = item.split('__Timestamp__')[1];
        modifiedItem = firebase.firestore.Timestamp.fromDate(new Date(dateString));
    }

    if(item.startsWith('__GeoPoint__')) {
        const geoSection = item.split('__GeoPoint__')[1];
        const [latitude, longitude] = geoSection.split('###');
        modifiedItem = new firebase.firestore.GeoPoint(parseFloat(latitude), parseFloat(longitude));
    }

    return modifiedItem;
}

function metadataIsEqual(metadata: firebase.firestore.SnapshotMetadata): boolean {
    return metadata.fromCache && !metadata.hasPendingWrites;
}

function documentIsEqual(id: string, docA: UnmappedData, docB: firebase.firestore.DocumentSnapshot): boolean {
    return isEqual(docA, docB.data()) && id === docB.id;
}

function getField(mappedObject: UnmappedData, fieldPath: string) {
    return get(mappedObject, fieldPath);
}

function objectifyDocument(
    partialObject: {
        [key: string]: SimpleJsonType,
    },
    firestore: firebase.firestore.Firestore
): firebase.firestore.DocumentSnapshot {
    const mappedObject = mapDeepWithArrays(partialObject, (item: string) => {
        return objectifyDocumentProperty(item, firestore);
    });
    const id = partialObject.__id__ as string;
    const path = partialObject.__path__ as string;
    const mappedObjectToInclude = omit(mappedObject, '__id__', '__path__');

    return {
        exists: true,
        id,
        metadata: {
            hasPendingWrites: false,
            fromCache: true,
            isEqual: metadataIsEqual
        },
        get: (fieldPath: string) => {
            return getField(mappedObjectToInclude, fieldPath);
        },
        ref: firebase.firestore().doc(path),
        isEqual(other: firebase.firestore.DocumentSnapshot): boolean {
            return documentIsEqual(id, mappedObjectToInclude, other);
        },
        data: () => mappedObjectToInclude
    };
}

export function deserializeDocumentSnapshotArray(
    string: string,
    firestore: firebase.firestore.Firestore
): firebase.firestore.DocumentSnapshot[] {
    const parsedString: any[] = JSON.parse(string);
    return parsedString.map(doc => {
        return objectifyDocument(doc, firestore);
    });
}

export function deserializeDocumentSnapshot(
    string: string,
    firestore: firebase.firestore.Firestore
): firebase.firestore.DocumentSnapshot {
    return objectifyDocument(JSON.parse(string), firestore);
}