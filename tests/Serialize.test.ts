import { initFirebase } from './prepare-tests'
import {
    collection,
    doc as docRef,
    CollectionReference,
    DocumentSnapshot,
    getDoc,
    getFirestore,
    getDocs,
} from 'firebase/firestore'
import { serializeDocumentSnapshot, serializeQuerySnapshot } from '../src'
import { should, use } from 'chai'
import chaiString from 'chai-string'
import { SerializedFirestoreType } from '../src/types'

should()
use(chaiString)

let testCollection: CollectionReference

describe('Serialize', () => {
    beforeEach(async () => {
        await initFirebase()
        const db = getFirestore()
        testCollection = collection(db, 'documents')
    })

    describe('Simple documents', () => {
        it('should serialize a simple document', async () => {
            const doc = await getDoc(docRef(testCollection, 'simple'))
            const serializedDocument = serializeDocumentSnapshot(doc)

            serializedDocument.should.be.a('string')
            JSON.parse(serializedDocument).should.have.property('a', 'b')
        })
    })

    describe('Documents with Timestamps', () => {
        it('should serialize a document with a Timestamp', async () => {
            const doc = await getDoc(docRef(testCollection, 'timestamp'))
            const serializedDocument = serializeDocumentSnapshot(doc)

            serializedDocument.should.be.a('string')
            JSON.parse(serializedDocument).should.have.property('a')
            JSON.parse(serializedDocument).a.should.have.property('__fsSerializer__')
            JSON.parse(serializedDocument).a.type.should.equal(SerializedFirestoreType.Timestamp)
            JSON.parse(serializedDocument).a.should.have.property('iso8601')
            JSON.parse(serializedDocument).a.iso8601.length.should.be.oneOf([24, 27])
        })
    })

    describe('Documents with GeoPoints', () => {
        const basicGeoPointAssertions = (doc: DocumentSnapshot) => {
            const serializedDocument = serializeDocumentSnapshot(doc)

            serializedDocument.should.be.a('string')
            JSON.parse(serializedDocument).should.have.property('a')
            JSON.parse(serializedDocument).a.should.have.property('__fsSerializer__')
            JSON.parse(serializedDocument).a.type.should.equal(SerializedFirestoreType.GeoPoint)
            JSON.parse(serializedDocument).a.should.have.property('latitude')
            JSON.parse(serializedDocument).a.should.have.property('longitude')
            return serializedDocument
        }

        it('should serialize a document with a simple GeoPoint', async () => {
            const doc = await getDoc(docRef(testCollection, 'geopoint'))
            basicGeoPointAssertions(doc)
        })

        it('should serialize a document with a GeoPoint containing floats', async () => {
            const doc = await getDoc(docRef(testCollection, 'geopoint-with-float'))
            basicGeoPointAssertions(doc)
        })

        it('should serialize a document with a GeoPoint containing floats and negative numbers', async () => {
            const doc = await getDoc(docRef(testCollection, 'geopoint-with-negative-float'))
            basicGeoPointAssertions(doc)
        })
    })

    describe('Documents with DocumentReferences', () => {
        it('should serialize a document with a DocumentReference', async () => {
            const doc = await getDoc(docRef(testCollection, 'document-reference'))
            const serializedData = serializeDocumentSnapshot(doc)

            serializedData.should.be.a('string')
            JSON.parse(serializedData).a.should.have.property('__fsSerializer__')
            JSON.parse(serializedData).a.type.should.equal(SerializedFirestoreType.DocumentReference)
            JSON.parse(serializedData).a.should.have.property('path')
        })
    })

    describe('Documents with multiple/nested special values', () => {
        it('should serialize a document with multiple different value types', async () => {
            const doc = await getDoc(docRef(testCollection, 'multiple'))
            const serializedData = serializeDocumentSnapshot(doc)

            serializedData.should.be.a('string')
            const parsedSerializedData = JSON.parse(serializedData)
            parsedSerializedData.should.have.property('a', 'b')
            parsedSerializedData.should.have.property('b')
            parsedSerializedData.b.type.should.equal(SerializedFirestoreType.Timestamp)
            parsedSerializedData.should.have.property('c')
            parsedSerializedData.c.type.should.equal(SerializedFirestoreType.GeoPoint)
            parsedSerializedData.should.have.property('d')
            parsedSerializedData.d.type.should.equal(SerializedFirestoreType.DocumentReference)
        })

        it('should serialize a document with nested values', async () => {
            const doc = await getDoc(docRef(testCollection, 'nested'))
            const serializedData = serializeDocumentSnapshot(doc)

            serializedData.should.be.a('string')
            const parsedSerializedData = JSON.parse(serializedData)
            parsedSerializedData.should.have.property('a', 'b')
            parsedSerializedData.should.have.property('b')
            parsedSerializedData.should.have.nested.property('b.c.type').which.equals(SerializedFirestoreType.Timestamp)
            parsedSerializedData.should.have.nested.property('b.d')
            parsedSerializedData.should.have.nested.property('b.d.e')
            parsedSerializedData.should.have.nested.property('b.d.e[0].type').which.equals(SerializedFirestoreType.GeoPoint)
            parsedSerializedData.should.have.nested.property('b.d.e[1].type').which.equals(SerializedFirestoreType.DocumentReference)
        })
    })

    describe('Queries with multiple documents', () => {
        it('should serialize all documents in array format', async () => {
            const response = await getDocs(testCollection)
            const serializedData = serializeQuerySnapshot(response)

            /*
            Some documents contain DocumentReferences, which are cyclical structures.
            If JSON.stringify() didn't throw an error, the stringification was definitely successful.
             */
            serializedData.should.be.a('string')
            const parsedSerializedData = JSON.parse(serializedData)
            parsedSerializedData.should.have.lengthOf(8)
        })
    })
})
