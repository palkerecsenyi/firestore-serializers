# firestore-serializers
[![Coverage Status](https://coveralls.io/repos/github/palkerecsenyi/firestore-serializers/badge.svg?branch=master)](https://coveralls.io/github/palkerecsenyi/firestore-serializers?branch=master)
![Unit tests](https://github.com/palkerecsenyi/firestore-serializers/workflows/Unit%20tests/badge.svg)

An automatic JavaScript serialization/deserialization system for Firestore

**Update April 2022**: `firestore-serializers` now works with Firebase v9 and the new tree-shaking optimised API.

## Features
- Simple to use – just pass a string to deserialize, or a DocumentSnapshot to serialize

- Also supports QuerySnapshot serialization and deserialization

- Can serialize/deserialize cyclical Firestore structures (e.g. DocumentReference) automatically

- Deep recursive serialization/deserialization, including array members

- Works in-browser, in Node.js, or anywhere Firebase v9+ is supported

- Comes with full TypeScript type definitions

- Tested with high code coverage

## Why?
Firestore provides offline support, but it's fairly primitive: if your device doesn't have an internet connection, it uses the cached data, but otherwise it uses live data. So when you're on a slow connection, it often takes ages to query data.

A fix for this is to manually store Firestore data in your own caching system (e.g. React Native's AsyncStorage or LocalStorage in a browser). However, this often presents challenges because Firestore documents can contain non-serializable values.

This library does the heavy lifting for you, by converting special Firestore types (e.g. GeoPoint or DocumentReference) in your documents into serializable values, and vice-versa.

## Installation
```
npm install firestore-serializers
```

## Usage
```typescript
import {getDoc, doc, getDocs, collection, getFirestore} from 'firebase/firestore';
import {serializeDocumentSnapshot, serializeQuerySnapshot, deserializeDocumentSnapshot, deserializeDocumentSnapshotArray} from "firestore-serializers";

const firestore = getFirestore();

const myDoc = await getDoc(doc(firestore, 'my-collection', 'abc'));
const myCollection = await getDocs(collection(firestore, 'my-collection'));

// stringify document (returns string)
const serializedDoc = serializeDocumentSnapshot(myDoc);
 
// stringify query snapshot (returns string)
const serializedCollection = serializeQuerySnapshot(myCollection);

/**
 * Returns DocumentSnapshot-like object
 * This matches the actual DocumentSnapshot class in behaviour and properties,
 * but is NOT an instance of the DocumentSnapshot class.
 * 
 * You need to pass `firestore` just like with all other v9 Firebase functions.
 */
deserializeDocumentSnapshot(
    serializedDoc,
    firestore,
);

/**
 * Returns an array of DocumentSnapshot-like objects
 * Does NOT return a QuerySnapshot.
 * Think of it as returning the contents of the 'docs' property of a QuerySnapshot.
 */
deserializeDocumentSnapshotArray(
    serializedCollection,
    firestore,
);
```

## Deserialization limitations
**In previous versions,** serialized documents used certain prefixes to denote when a property is a special Firestore type (GeoPoint, Timestamp, or DocumentReference). This means if you were genuinely storing one of the following string values (independently of `firestore-serializers`) and tried to deserialize a document, `firestore-serializers` would try to decode it as a Firestore type:

- `__DocumentReference__`
- `__GeoPoint__`
- `__Timestamp__`

The latest version of `firestore-serializers` instead represents serialized values as objects. Any object containing the following will be deserialized:

```json
{
  "__fsSerializer__": "special",
  "type": ...,
  ...,
}
```

If you still need backwards-compatibility with the previous string format (e.g. to not invalidate caches on client devices), you can pass an option shown below. However, keep in mind the old approach may be susceptible to injection attacks!

```typescript
deserializeDocumentSnapshot(
    stringToDeserialize,
    firestore,
    {
        backwardsCompatibility: true,
    },
)

// same syntax for deserializeDocumentSnapshotArray
```

## License
Licensed under the MIT license. Copyright Pal Kerecsenyi.
