import type { DocumentReference, GeoPoint, Timestamp } from 'firebase/firestore'
import { get, hasIn } from 'lodash'

export function itemIsDocumentReference(item: any): item is DocumentReference {
    return [
        hasIn(item, 'id'),
        hasIn(item, 'parent'),
        hasIn(item, 'path'),
        get(item, 'type') === 'document',
    ].every(e => e === true)
}

export function itemIsGeoPoint(item: any): item is GeoPoint {
    return [
        hasIn(item, 'latitude'),
        hasIn(item, 'longitude'),
    ].every(e => e === true)
}

export function itemIsTimestamp(item: any): item is Timestamp {
    return [
        hasIn(item, 'seconds'),
        hasIn(item, 'nanoseconds'),
        hasIn(item, 'toDate'),
    ].every(e => e === true)
}
