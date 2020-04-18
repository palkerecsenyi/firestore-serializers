import {initFirebase} from "./prepare-tests";
import firebase from "firebase";
import 'firebase/firestore';
import {serializeDocumentSnapshot} from "../src/Serialize";
import chai from 'chai';
import chaiString from 'chai-string';
import DocumentSnapshot = firebase.firestore.DocumentSnapshot;

chai.should();
chai.use(chaiString);

const collection = firebase.firestore()
    .collection('documents');

describe('Serialize', () => {
    beforeEach(async () => {
        await initFirebase();
    });

    describe('Simple documents', () => {
        it('should serialize a simple document', async () => {
            const doc = await collection
                .doc('simple')
                .get();

            const serializedDocument = serializeDocumentSnapshot(doc);

            serializedDocument.should.be.a('string')
            JSON.parse(serializedDocument).should.have.property('a', 'b');
        });
    });

    describe('Documents with Timestamps', () => {
        it('should serialize a document with a Timestamp', async () => {
            const doc = await collection
                .doc('timestamp')
                .get();

            const serializedDocument = serializeDocumentSnapshot(doc);

            serializedDocument.should.be.a('string');
            JSON.parse(serializedDocument).should.have.property('a');
            JSON.parse(serializedDocument).a.should.startWith('__Timestamp__');
        });
    });

    describe('Documents with GeoPoints', () => {
        const basicGeoPointAssertions = (doc: DocumentSnapshot) => {
            const serializedDocument = serializeDocumentSnapshot(doc);

            serializedDocument.should.be.a('string');
            JSON.parse(serializedDocument).should.have.property('a');
            JSON.parse(serializedDocument).a.should.startWith('__GeoPoint__');
            JSON.parse(serializedDocument).a.should.contain('###');
            return serializedDocument;
        }

        it('should serialize a document with a simple GeoPoint', async () => {
            const doc = await collection
                .doc('geopoint')
                .get();

            basicGeoPointAssertions(doc);
        });

        it('should serialize a document with a GeoPoint containing floats', async () => {
            const doc = await collection
                .doc('geopoint-with-float')
                .get();

            basicGeoPointAssertions(doc);
        });

        it('should serialize a document with a GeoPoint containing floats and negative numbers', async () => {
            const doc = await collection
                .doc('geopoint-with-negative-float')
                .get();

            basicGeoPointAssertions(doc);
        });
    });

    describe('Documents with DocumentReferences', () => {
       it('should serialize a document with a DocumentReference', async () => {
           const doc = await collection
               .doc('document-reference')
               .get();

           const serializedData = serializeDocumentSnapshot(doc);

           serializedData.should.be.a('string');
           JSON.parse(serializedData).a.should.startWith('__DocumentReference__');
       });
    });

    describe('Documents with multiple/nested special values', () => {
        it('should serialize a document with multiple different value types', async () => {
            const doc = await collection
                .doc('multiple')
                .get();

            const serializedData = serializeDocumentSnapshot(doc);

            serializedData.should.be.a('string');
            JSON.parse(serializedData).should.have.property('a', 'b');
            JSON.parse(serializedData).should.have.property('b');
            JSON.parse(serializedData).b.should.startWith('__Timestamp__');
            JSON.parse(serializedData).should.have.property('c');
            JSON.parse(serializedData).c.should.startWith('__GeoPoint__');
            JSON.parse(serializedData).should.have.property('d');
            JSON.parse(serializedData).d.should.startWith('__DocumentReference__');
        });

        it('should serialize a document with nested values', async () => {
            const doc = await collection
                .doc('nested')
                .get();

            const serializedData = serializeDocumentSnapshot(doc);

            serializedData.should.be.a('string');
            JSON.parse(serializedData).should.have.property('a', 'b')
            JSON.parse(serializedData).should.have.property('b')
            JSON.parse(serializedData).should.have.property('b.c')
            JSON.parse(serializedData).should.have.property('b.d')
            JSON.parse(serializedData).should.have.property('b.d.e')
        });
    });
});