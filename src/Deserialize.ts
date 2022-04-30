import { Firestore, doc, GeoPoint, Timestamp, SnapshotMetadata, DocumentSnapshot } from 'firebase/firestore'
import type { DataMappedValue, UnmappedData } from './types'
import { mapDeepWithArrays } from './map-deep-with-arrays'
import { get, omit } from 'lodash'
import { serialItemIsSpecial } from './firestore-identifiers'
import { SerializedFirestoreType } from './types'

function objectifyDocumentProperty(
    item: string,
    firestore: Firestore,
    backwardsCompatibility: boolean,
): any {
    let modifiedItem: any = item

    if (serialItemIsSpecial(modifiedItem)) {
        switch (modifiedItem.type) {
            case SerializedFirestoreType.DocumentReference:
                modifiedItem = doc(firestore, modifiedItem.path)
                break
            case SerializedFirestoreType.GeoPoint:
                modifiedItem = new GeoPoint(modifiedItem.latitude, modifiedItem.longitude)
                break
            case SerializedFirestoreType.Timestamp:
                modifiedItem = Timestamp.fromDate(new Date(modifiedItem.iso8601))
                break
        }
    }

    if (backwardsCompatibility && typeof item === 'string' && item.startsWith) {
        if (item.startsWith('__DocumentReference__')) {
            const path = item.split('__DocumentReference__')[1]
            modifiedItem = doc(firestore, path)
        } else if (item.startsWith('__GeoPoint__')) {
            const geoSection = item.split('__GeoPoint__')[1]
            const [latitude, longitude] = geoSection.split('###')
            modifiedItem = new GeoPoint(parseFloat(latitude), parseFloat(longitude))
        } else if (item.startsWith('__Timestamp__')) {
            const dateString = item.split('__Timestamp__')[1]
            modifiedItem = Timestamp.fromDate(new Date(dateString))
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
        [key: string]: DataMappedValue,
    },
    firestore: Firestore,
    backwardsCompatibility: boolean,
): DocumentSnapshot {
    const mappedObject = mapDeepWithArrays(partialObject, (item: string) => {
        return objectifyDocumentProperty(item, firestore, backwardsCompatibility)
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

type Options = {
    backwardsCompatibility: boolean
}

export function deserializeDocumentSnapshotArray(
    string: string,
    firestore: Firestore,
    options?: Options,
): DocumentSnapshot[] {
    // noinspection TypeScriptUnresolvedVariable
    const parsedString: any[] = JSON.parse(string)
    return parsedString.map(doc => {
        return objectifyDocument(doc, firestore, options?.backwardsCompatibility === true)
    })
}

export function deserializeDocumentSnapshot(
    string: string,
    firestore: Firestore,
    options?: Options,
): DocumentSnapshot {
    // noinspection TypeScriptUnresolvedVariable
    return objectifyDocument(JSON.parse(string), firestore, options?.backwardsCompatibility === true)
}
