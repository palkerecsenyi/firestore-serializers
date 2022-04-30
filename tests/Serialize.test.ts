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
            JSON.parse(serializedDocument).a.should.startWith('__Timestamp__')
        })
    })

    describe('Documents with GeoPoints', () => {
        const basicGeoPointAssertions = (doc: DocumentSnapshot) => {
            const serializedDocument = serializeDocumentSnapshot(doc)

            serializedDocument.should.be.a('string')
            JSON.parse(serializedDocument).should.have.property('a')
            JSON.parse(serializedDocument).a.should.startWith('__GeoPoint__')
            JSON.parse(serializedDocument).a.should.contain('###')
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
            JSON.parse(serializedData).a.should.startWith('__DocumentReference__')
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
            parsedSerializedData.b.should.startWith('__Timestamp__')
            parsedSerializedData.should.have.property('c')
            parsedSerializedData.c.should.startWith('__GeoPoint__')
            parsedSerializedData.should.have.property('d')
            parsedSerializedData.d.should.startWith('__DocumentReference__')
        })

        it('should serialize a document with nested values', async () => {
            const doc = await getDoc(docRef(testCollection, 'nested'))
            const serializedData = serializeDocumentSnapshot(doc)

            serializedData.should.be.a('string')
            const parsedSerializedData = JSON.parse(serializedData)
            parsedSerializedData.should.have.property('a', 'b')
            parsedSerializedData.should.have.property('b')
            parsedSerializedData.should.have.nested.property('b.c').which.startsWith('__Timestamp__')
            parsedSerializedData.should.have.nested.property('b.d')
            parsedSerializedData.should.have.nested.property('b.d.e')
            parsedSerializedData.should.have.nested.property('b.d.e[0]').which.startsWith('__GeoPoint__')
            parsedSerializedData.should.have.nested.property('b.d.e[1]').which.startsWith('__DocumentReference__')
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
