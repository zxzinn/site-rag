/**
 * Stores an object in chrome.storage.sync by splitting it into chunks
 * @param key The base key to store the object under
 * @param objectToStore The object to store
 */
export async function setStore(
  key: string,
  objectToStore: Record<string, any>,
): Promise<void> {
  const jsonstr = JSON.stringify(objectToStore);
  let i = 0;
  const storageObj: Record<string, string> = {};

  // split jsonstr into chunks and store them in an object indexed by `key_i`
  let remainingStr = jsonstr;
  while (remainingStr.length > 0) {
    const index = `${key}_${i++}`;

    // since the key uses up some per-item quota, see how much is left for the value
    // also trim off 2 for quotes added by storage-time `stringify`
    let valueLength =
      chrome.storage.sync.QUOTA_BYTES_PER_ITEM - index.length - 2;

    // trim down segment so it will be small enough even when run through `JSON.stringify` again at storage time
    let segment = remainingStr.slice(0, valueLength);
    while (JSON.stringify(segment).length > valueLength) {
      segment = remainingStr.slice(0, --valueLength);
    }

    storageObj[index] = segment;
    remainingStr = remainingStr.slice(valueLength);
  }

  // store all the chunks
  await chrome.storage.sync.set(storageObj);
}

/**
 * Retrieves and reconstructs an object stored with setStore
 * @param key The base key the object was stored under
 * @returns The reconstructed object, or undefined if not found
 */
export async function getStore<T = Record<string, any>>(
  key: string,
): Promise<T | undefined> {
  // Get all items from storage
  const result = await chrome.storage.sync.get(null);

  // Find all keys that match our pattern (key_0, key_1, etc)
  const relevantKeys = Object.keys(result)
    .filter((k) => k.startsWith(`${key}_`))
    .sort((a, b) => {
      // Extract and compare the numeric portion for proper ordering
      const aNum = parseInt(a.split("_")[1]);
      const bNum = parseInt(b.split("_")[1]);
      return aNum - bNum;
    });

  if (relevantKeys.length === 0) {
    return undefined;
  }

  // Combine all chunks
  const jsonString = relevantKeys.map((k) => result[k]).join("");

  try {
    return JSON.parse(jsonString) as T;
  } catch (e) {
    console.error("Error parsing stored JSON:", e);
    return undefined;
  }
}
