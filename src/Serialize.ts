import type { DocumentSnapshot, QueryDocumentSnapshot, QuerySnapshot } from 'firebase/firestore'
import { mapDeepWithArrays } from './map-deep-with-arrays'
import { itemIsDocumentReference, itemIsGeoPoint, itemIsTimestamp } from './firestore-identifiers'
import { DataMappedValue, SerializedFirestoreType, SerializedFirestoreValue } from './types'

function stringifyDocumentProperty(item: any): DataMappedValue {
    let modifiedItem: SerializedFirestoreValue = item

    if (itemIsDocumentReference(item)) {
        modifiedItem = {
            __fsSerializer__: 'special',
            type: SerializedFirestoreType.DocumentReference,
            path: item.path
        }
    }

    if (itemIsGeoPoint(item)) {
        modifiedItem = {
            __fsSerializer__: 'special',
            type: SerializedFirestoreType.GeoPoint,
            latitude: item.latitude,
            longitude: item.longitude
        }
    }

    if (itemIsTimestamp(item)) {
        modifiedItem = {
            __fsSerializer__: 'special',
            type: SerializedFirestoreType.Timestamp,
            iso8601: item.toDate().toISOString()
        }
    }

    return modifiedItem
}

function stringifyDocument(document: DocumentSnapshot): any {
    const data = document.data()

    const dataToStringify = mapDeepWithArrays(data, stringifyDocumentProperty)
    return {
        __id__: document.id,
        __path__: document.ref.path,
        ...dataToStringify,
    }
}

export function serializeQuerySnapshot(querySnapshot: QuerySnapshot): string {
    const stringifiedDocs = querySnapshot.docs.map((doc: QueryDocumentSnapshot) => {
        return stringifyDocument(doc)
    })

    return JSON.stringify(stringifiedDocs)
}

export function serializeDocumentSnapshot(documentSnapshot: DocumentSnapshot) {
    return JSON.stringify(stringifyDocument(documentSnapshot))
}
