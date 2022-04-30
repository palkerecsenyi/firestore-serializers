import { cloneDeep, get, isArray, set, isObject, flattenDeep } from 'lodash'
import { itemIsDocumentReference, itemIsGeoPoint, itemIsTimestamp, serialItemIsSpecial } from './firestore-identifiers'
import type { DataMappedValue, DataUnmappedValue, MappedData, UnmappedData } from './types'

type RecursiveStringArray = string | RecursiveStringArray[];

function getDeepListOfKeysWithoutInvadingFirebaseProperties(
    object: {
        [key: string]: any
    },
    prefix: string = '',
): string[] {
    let keysList: RecursiveStringArray[] = []

    for (const key in object) {
        if (object.hasOwnProperty(key)) {
            const item = object[key]
            const prefixKeyWith = prefix === '' ? '' : prefix + '.'

            if (isObject(item)) {
                // don't dive further into the object if it's an important Firestore type (or a serialized type)
                if (!itemIsDocumentReference(item)
                    && !itemIsTimestamp(item)
                    && !itemIsGeoPoint(item)
                    && !serialItemIsSpecial(item)
                ) {
                    keysList.push(
                        getDeepListOfKeysWithoutInvadingFirebaseProperties(
                            item,
                            prefixKeyWith + key,
                        ))
                } else {
                    keysList.push(
                        prefixKeyWith + key,
                    )
                }
            } else {
                keysList.push(
                    prefixKeyWith + key,
                )
            }
        }
    }

    return flattenDeep(keysList)
}

export function mapDeepWithArrays(
    object: MappedData | DataMappedValue[],
    callback: (item: DataMappedValue) => DataUnmappedValue,
): UnmappedData;
export function mapDeepWithArrays(
    object: UnmappedData | DataUnmappedValue[],
    callback: (item: any) => DataMappedValue,
): MappedData {
    const clonedObject = cloneDeep(object)
    const keys = getDeepListOfKeysWithoutInvadingFirebaseProperties(object)

    for (const key of keys) {
        const item = get(clonedObject, key)
        let newItem = cloneDeep(item)

        if (isArray(item)) {
            newItem = mapDeepWithArrays(item, callback)
        } else {
            newItem = callback(item)
        }

        set(clonedObject, key, newItem)
    }

    return clonedObject as MappedData
}
