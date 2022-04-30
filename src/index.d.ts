import type { DocumentSnapshot, QuerySnapshot, DocumentData, Firestore } from 'firebase/firestore'

declare function serializeDocumentSnapshot(
    documentSnapshot: DocumentSnapshot,
): string;

declare function serializeQuerySnapshot(
    querySnapshot: QuerySnapshot,
): string;

declare function deserializeDocumentSnapshot<T = DocumentData>(
    input: string,
    firestore: Firestore,
): DocumentSnapshot<T>;

declare function deserializeDocumentSnapshotArray<T = DocumentData>(
    input: string,
    firestore: Firestore,
): DocumentSnapshot<T>[];
