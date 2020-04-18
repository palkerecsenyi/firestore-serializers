import { cloneDeep, get, isArray, set, isObject, flattenDeep } from "lodash";
import firebase from "firebase";
import 'firebase/firestore';
import {itemIsDocumentReference, itemIsGeoPoint, itemIsTimestamp} from "./firestore-identifiers";

type DataMappedValue = string | number | boolean | MappedData | DataMappedValue[];

type DataUnmappedValue = string | number | boolean | UnmappedData | DataUnmappedValue[] |
    firebase.firestore.DocumentReference | firebase.firestore.Timestamp | firebase.firestore.GeoPoint;

type UnmappedData = {
    [key: string]: DataUnmappedValue
}

type MappedData = {
    [key: string]: DataMappedValue;
}

type MapCallback = (element: DataUnmappedValue) => DataMappedValue;

type RecursiveStringArray = string | RecursiveStringArray[];

function getDeepListOfKeysWithoutInvadingFirebaseProperties(
    object: {
        [key: string]: any
    },
    prefix: string = ''
): string[] {
    let keysList: RecursiveStringArray[] = [];

    for(const key in object) {
        if(object.hasOwnProperty(key)) {
            const item = object[key];
            const prefixKeyWith = prefix === '' ? '' : prefix + '.';

            if(isObject(item)) {
                // don't dive further into the object if it's an important Firestore type
                if(!itemIsDocumentReference(item)
                    && !itemIsTimestamp(item)
                    && !itemIsGeoPoint(item)
                ) {
                    keysList.push(
                        getDeepListOfKeysWithoutInvadingFirebaseProperties(
                            item,
                            prefixKeyWith + key
                        ));
                } else {
                    keysList.push(
                        prefixKeyWith + key
                    );
                }
            } else {
                keysList.push(
                    prefixKeyWith + key
                );
            }
        }
    }

    return flattenDeep(keysList);
}

export function mapDeepWithArrays(object: UnmappedData | DataMappedValue[], callback: MapCallback): MappedData {
    const clonedObject = cloneDeep(object);
    const keys = getDeepListOfKeysWithoutInvadingFirebaseProperties(object);

    for(const key of keys) {
        const item = get(clonedObject, key);
        let newItem: DataMappedValue = cloneDeep(item as unknown as DataMappedValue);

        if(isArray(item)) {
            newItem = mapDeepWithArrays(item, callback);
        } else {
            newItem = callback(item);
        }

        set(clonedObject, key, newItem);
    }

    return clonedObject as MappedData;
}
