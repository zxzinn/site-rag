const DB_NAME = "site_rag";
const DB_VERSION = 2; // Increment version to force upgrade
const STORE_NAME = "dataStore";

async function deleteDatabase(): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.deleteDatabase(DB_NAME);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(new Error("Failed to delete database"));
  });
}

function initDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = async () => {
      // If there's an error, try deleting and recreating the database
      try {
        await deleteDatabase();
        const newRequest = indexedDB.open(DB_NAME, DB_VERSION);
        newRequest.onupgradeneeded = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;
          db.createObjectStore(STORE_NAME);
        };
        newRequest.onsuccess = (event) => {
          resolve((event.target as IDBOpenDBRequest).result);
        };
        newRequest.onerror = () => {
          reject(new Error("Failed to open database after deletion"));
        };
      } catch (error) {
        reject(error);
      }
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      resolve(db);
    };
  });
}

// Function to store JSON data
export async function storeDataInIndexedDB<T>(
  key: string,
  jsonData: T,
): Promise<void> {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], "readwrite");
      const objectStore = transaction.objectStore(STORE_NAME);

      const storeRequest = objectStore.put(jsonData, key);

      storeRequest.onerror = () => {
        reject(new Error("Failed to store data"));
      };

      storeRequest.onsuccess = () => {
        resolve();
      };

      transaction.oncomplete = () => {
        db.close();
      };
    });
  } catch (error) {
    console.error("Error storing data:", error);
    throw error;
  }
}

// Function to retrieve JSON data
export async function getDataFromIndexedDB<T>(key: string): Promise<T> {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], "readonly");
      const objectStore = transaction.objectStore(STORE_NAME);

      const getRequest = objectStore.get(key);

      getRequest.onerror = () => {
        reject(new Error("Failed to retrieve data"));
      };

      getRequest.onsuccess = () => {
        resolve(getRequest.result);
      };

      transaction.oncomplete = () => {
        db.close();
      };
    });
  } catch (error) {
    console.error("Error retrieving data:", error);
    throw error;
  }
}
