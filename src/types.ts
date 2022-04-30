import type { DocumentReference, GeoPoint, Timestamp } from 'firebase/firestore'

export type DataMappedValue = string | number | boolean | MappedData | DataMappedValue[];

export type DataUnmappedValue =
    string
    | number
    | boolean
    | UnmappedData
    | DataUnmappedValue[]
    | DocumentReference
    | Timestamp
    | GeoPoint;

export type UnmappedData = {
    [key: string]: DataUnmappedValue
}

export type MappedData = {
    [key: string]: DataMappedValue
} | {}

export enum SerializedFirestoreType {
    DocumentReference,
    GeoPoint,
    Timestamp,
}

interface SerializedFirestoreValueBase {
    __fsSerializer__: 'special'
    type: SerializedFirestoreType
}

export interface SerializedFirestoreDocumentReference extends SerializedFirestoreValueBase {
    type: SerializedFirestoreType.DocumentReference
    path: string
}

export interface SerializedFirestoreGeoPoint extends SerializedFirestoreValueBase {
    type: SerializedFirestoreType.GeoPoint
    latitude: number
    longitude: number
}

export interface SerializedFirestoreTimestamp extends SerializedFirestoreValueBase {
    type: SerializedFirestoreType.Timestamp
    iso8601: string
}

export type SerializedFirestoreValue = SerializedFirestoreDocumentReference | SerializedFirestoreGeoPoint | SerializedFirestoreTimestamp
