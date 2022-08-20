import { initializeApp } from 'firebase/app'
import { doc, GeoPoint, getFirestore, Timestamp, writeBatch } from 'firebase/firestore'
import { SerializedFirestoreType } from '../src/types'
import { cloneDeep } from 'lodash'

initializeApp({
    apiKey: "AIzaSyDgi2XrGM9vDFpMGYjEjEkYA3Szl2dnBOY",
    projectId: "firestore-serializer-test",
    appId: "1:492120789873:web:91dbee7c7e352dcfabdcd0",
})

const db = getFirestore()

export async function initFirebase() {
    /**
     * Guide to changing these documents to add/modify tests:
     *
     * - The IDs specified here refer to document IDs.
     * These can be referenced using `firebase.firestore().collection('documents').doc(ID)` during any test
     *
     * - These documents are re-created between every test
     *
     * - Please note that the tests depend on the contents of these documents.
     * Make sure to update all tests to reflect any content changes you make
     *
     * - Some tests may rely on the amount of documents, so make sure the update those too
     */
    const documents = [
        { id: 'simple', a: 'b' },
        { id: 'timestamp', a: Timestamp.fromDate(new Date()) },
        { id: 'geopoint', a: new GeoPoint(10, 10) },
        { id: 'geopoint-with-float', a: new GeoPoint(2.3294, 34.224) },
        { id: 'geopoint-with-negative-float', a: new GeoPoint(2.314, -32.443) },
        { id: 'document-reference', a: doc(db, 'documents', 'simple') },
        {
            id: 'multiple',
            a: 'b',
            b: Timestamp.fromDate(new Date()),
            c: new GeoPoint(4.3234, -2.234),
            d: doc(db, 'documents', 'simple'),
        },
        {
            id: 'nested',
            a: 'b',
            b: {
                c: Timestamp.fromDate(new Date()),
                d: {
                    e: [
                        new GeoPoint(3.43, -3.445),
                        doc(db, 'documents', 'simple'),
                    ],
                },
            },
        },
    ]

    const batch = writeBatch(db)

    documents.forEach(e => {
        batch.set(
            doc(db, 'documents', e.id),
            e,
        )
    })

    await batch.commit()
}

export enum DeserializationTestString {
    Simple = 'simple',
    Timestamp = 'timestamp',
    GeoPoint = 'geopoint',
    GeoPointFloat = 'geopoint-with-float',
    GeoPointFloatNegative = 'geopoint-with-negative-float',
    DocumentReference = 'document-reference',
    Multiple = 'multiple',
    Nested = 'nested',
    Query = 'query',
}

const generateBaseObject = (id: string) => {
    return {
        __id__: id,
        __path__: `documents/${id}`,
        id: id,
    }
}

const generateSerializedObject = (type: SerializedFirestoreType, value: any) => {
    return {
        __fsSerializer__: 'special',
        type,
        ...value,
    }
}

export function getDeserializationTestObject(type: DeserializationTestString, legacy: boolean) {
    const legacyObjects = {
        [DeserializationTestString.Simple]: {
            a: 'b',
            ...generateBaseObject('simple'),
        },
        [DeserializationTestString.Timestamp]: {
            a: '__Timestamp__2020-04-19T12:31:15.360Z',
            ...generateBaseObject('timestamp'),
        },
        [DeserializationTestString.GeoPoint]: {
            a: '__GeoPoint__10###10',
            ...generateBaseObject('geopoint'),
        },
        [DeserializationTestString.GeoPointFloat]: {
            a: '__GeoPoint__2.3294###34.224',
            ...generateBaseObject('geopoint-with-float'),
        },
        [DeserializationTestString.GeoPointFloatNegative]: {
            a: '__GeoPoint__2.314###-32.443',
            ...generateBaseObject('geopoint-with-negative-float'),
        },
        [DeserializationTestString.DocumentReference]: {
            a: '__DocumentReference__documents/simple',
            ...generateBaseObject('document-reference'),
        },
        [DeserializationTestString.Multiple]: {
            a: 'b',
            b: '__Timestamp__2020-04-19T15:17:33.856Z',
            c: '__GeoPoint__4.3234###-2.234',
            d: '__DocumentReference__documents/simple',
            ...generateBaseObject('multiple'),
        },
        [DeserializationTestString.Nested]: {
            a: 'b',
            b: {
                d: {
                    e: [
                        '__GeoPoint__3.43###-3.445',
                        '__DocumentReference__documents/simple',
                    ]
                },
                c: '__Timestamp__2020-04-19T15:21:09.935Z',
            },
            ...generateBaseObject('nested'),
        },
        [DeserializationTestString.Query]: {},
    }

    const newObjects: {
        [key: string]: any
    } = {}
    for (const key of Object.keys(legacyObjects)) {
        let object: {
            [key: string]: any
        } = cloneDeep(legacyObjects[key as DeserializationTestString])

        switch (key) {
            case DeserializationTestString.Simple:
                newObjects['simple'] = legacyObjects['simple']
                break
            case DeserializationTestString.Timestamp:
                object.a = generateSerializedObject(SerializedFirestoreType.Timestamp, {
                    iso8601: '2020-04-19T12:31:15.360Z',
                })
                newObjects['timestamp'] = object
                break
            case DeserializationTestString.GeoPoint:
                object.a = generateSerializedObject(SerializedFirestoreType.GeoPoint, {
                    latitude: 10,
                    longitude: 10,
                })
                newObjects['geopoint'] = object
                break
            case DeserializationTestString.GeoPointFloat:
                object.a = generateSerializedObject(SerializedFirestoreType.GeoPoint, {
                    latitude: 2.3294,
                    longitude: 34.224,
                })
                newObjects['geopoint-with-float'] = object
                break
            case DeserializationTestString.GeoPointFloatNegative:
                object.a = generateSerializedObject(SerializedFirestoreType.GeoPoint, {
                    latitude: 2.314,
                    longitude: -32.443,
                })
                newObjects['geopoint-with-negative-float'] = object
                break
            case DeserializationTestString.DocumentReference:
                object.a = generateSerializedObject(SerializedFirestoreType.DocumentReference, {
                    path: 'documents/simple',
                })
                newObjects['document-reference'] = object
                break
            case DeserializationTestString.Multiple:
                object.b = generateSerializedObject(SerializedFirestoreType.Timestamp, {
                    iso8601: '2020-04-19T15:17:33.856Z',
                })
                object.c = generateSerializedObject(SerializedFirestoreType.GeoPoint, {
                    latitude: 4.3234,
                    longitude: -2.234,
                })
                object.d = generateSerializedObject(SerializedFirestoreType.DocumentReference, {
                    path: 'documents/simple',
                })
                newObjects['multiple'] = object
                break
            case DeserializationTestString.Nested:
                object.b.d.e[0] = generateSerializedObject(SerializedFirestoreType.GeoPoint, {
                    latitude: 3.43,
                    longitude: -3.445,
                })
                object.b.d.e[1] = generateSerializedObject(SerializedFirestoreType.DocumentReference, {
                    path: 'documents/simple',
                })
                object.b.c = generateSerializedObject(SerializedFirestoreType.Timestamp, {
                    iso8601: '2020-04-19T15:21:09.935Z',
                })
                newObjects['nested'] = object
                break
        }
    }

    if (type === DeserializationTestString.Query) {
        if (legacy) {
            delete legacyObjects[DeserializationTestString.Query]
            return Object.values(legacyObjects)
        } else {
            return Object.values(newObjects)
        }
    }

    if (legacy) {
        return legacyObjects[type]
    } else {
        return newObjects[type]
    }
}

export function getDeserializationTestString(type: DeserializationTestString, legacy = false) {
    return JSON.stringify(getDeserializationTestObject(type, legacy))
}
