import { Firestore, doc, GeoPoint, Timestamp, SnapshotMetadata, DocumentSnapshot } from 'firebase/firestore'
import { SimpleJsonType } from './types'
import { mapDeepWithArrays, UnmappedData } from './map-deep-with-arrays'
import { get, omit } from 'lodash'

function objectifyDocumentProperty(
    item: string,
    firestore: Firestore,
): any {
    let modifiedItem: any = item

    if (typeof item === 'string' && item.startsWith) {
        if (item.startsWith('__DocumentReference__')) {
            const path = item.split('__DocumentReference__')[1]
            modifiedItem = doc(firestore, path)
        }

        if (item.startsWith('__Timestamp__')) {
            const dateString = item.split('__Timestamp__')[1]
            modifiedItem = Timestamp.fromDate(new Date(dateString))
        }

        if (item.startsWith('__GeoPoint__')) {
            const geoSection = item.split('__GeoPoint__')[1]
            const [latitude, longitude] = geoSection.split('###')
            modifiedItem = new GeoPoint(parseFloat(latitude), parseFloat(longitude))
        }
    }

    return modifiedItem
}

function metadataIsEqual(metadata: SnapshotMetadata): boolean {
    return metadata.fromCache && !metadata.hasPendingWrites
}

function getField(mappedObject: UnmappedData, fieldPath: string) {
    return get(mappedObject, fieldPath)
}

function objectifyDocument(
    partialObject: {
        [key: string]: SimpleJsonType,
    },
    firestore: Firestore,
): DocumentSnapshot {
    const mappedObject = mapDeepWithArrays(partialObject, (item: string) => {
        return objectifyDocumentProperty(item, firestore)
    })
    const id = partialObject.__id__ as string
    const path = partialObject.__path__ as string
    const mappedObjectToInclude = omit(mappedObject, '__id__', '__path__')

    return {
        exists: () => true,
        id,
        metadata: {
            hasPendingWrites: false,
            fromCache: true,
            isEqual: metadataIsEqual,
        },
        get: (fieldPath: string) => {
            return getField(mappedObjectToInclude, fieldPath)
        },
        ref: doc(firestore, path),
        data: () => mappedObjectToInclude,
    }
}

export function deserializeDocumentSnapshotArray(
    string: string,
    firestore: Firestore,
): DocumentSnapshot[] {
    const parsedString: any[] = JSON.parse(string)
    return parsedString.map(doc => {
        return objectifyDocument(doc, firestore)
    })
}

export function deserializeDocumentSnapshot(
    string: string,
    firestore: Firestore,
): DocumentSnapshot {
    return objectifyDocument(JSON.parse(string), firestore)
}
