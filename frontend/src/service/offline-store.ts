const DATABASE_NAME = "umuryango-offline-v1";
const DATABASE_VERSION = 1;
const META_STORE = "meta";
const RESPONSE_STORE = "responses";
const OUTBOX_STORE = "outbox";

type EncryptedValue = {
  iv: ArrayBuffer;
  ciphertext: ArrayBuffer;
};

export type OfflineMutation = {
  id: string;
  accountId: string;
  method: "post" | "put" | "patch" | "delete";
  url: string;
  data: unknown;
  headers: Record<string, string>;
  createdAt: string;
};

type StoredResponse = EncryptedValue & {
  key: string;
  accountId: string;
  updatedAt: string;
};

type StoredMutation = EncryptedValue & {
  id: string;
  accountId: string;
  createdAt: string;
};

type WebOfflineLogin = {
  accountId: string;
  identifier: string;
  salt: ArrayBuffer;
  verifier: ArrayBuffer;
};

function canUseOfflineStore() {
  return (
    typeof window !== "undefined" && "indexedDB" in window && "crypto" in window
  );
}

function openDatabase() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);

    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(META_STORE)) {
        database.createObjectStore(META_STORE);
      }
      if (!database.objectStoreNames.contains(RESPONSE_STORE)) {
        database.createObjectStore(RESPONSE_STORE, { keyPath: "key" });
      }
      if (!database.objectStoreNames.contains(OUTBOX_STORE)) {
        const store = database.createObjectStore(OUTBOX_STORE, {
          keyPath: "id",
        });
        store.createIndex("accountId", "accountId");
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(request.error ?? new Error("Unable to open offline storage."));
  });
}

function requestResult<T>(request: IDBRequest<T>) {
  return new Promise<T>((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(request.error ?? new Error("Offline storage request failed."));
  });
}

async function getMeta<T>(key: string) {
  const database = await openDatabase();
  try {
    const transaction = database.transaction(META_STORE, "readonly");
    return (await requestResult(
      transaction.objectStore(META_STORE).get(key),
    )) as T | undefined;
  } finally {
    database.close();
  }
}

async function setMeta(key: string, value: unknown) {
  const database = await openDatabase();
  try {
    const transaction = database.transaction(META_STORE, "readwrite");
    await requestResult(transaction.objectStore(META_STORE).put(value, key));
  } finally {
    database.close();
  }
}

async function encryptionKey() {
  let key = await getMeta<CryptoKey>("encryptionKey");
  if (!key) {
    key = await crypto.subtle.generateKey(
      { name: "AES-GCM", length: 256 },
      false,
      ["encrypt", "decrypt"],
    );
    await setMeta("encryptionKey", key);
  }
  return key;
}

async function encrypt(value: unknown, scope: string): Promise<EncryptedValue> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const plaintext = new TextEncoder().encode(JSON.stringify(value));
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv, additionalData: new TextEncoder().encode(scope) },
    await encryptionKey(),
    plaintext,
  );
  return { iv: iv.buffer, ciphertext };
}

async function decrypt<T>(value: EncryptedValue, scope: string) {
  const plaintext = await crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv: value.iv,
      additionalData: new TextEncoder().encode(scope),
    },
    await encryptionKey(),
    value.ciphertext,
  );
  return JSON.parse(new TextDecoder().decode(plaintext)) as T;
}

export async function setOfflineAccount(accountId: string) {
  if (!canUseOfflineStore() || !accountId) return;
  await setMeta("activeAccountId", accountId);
}

async function derivePasswordVerifier(password: string, salt: ArrayBuffer) {
  const passwordKey = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  return crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      hash: "SHA-256",
      salt,
      iterations: 120_000,
    },
    passwordKey,
    256,
  );
}

export async function prepareWebOfflineLogin(
  accountId: string,
  identifier: string,
  password: string,
) {
  if (!canUseOfflineStore() || !accountId || !password) return;
  const saltBytes = crypto.getRandomValues(new Uint8Array(16));
  const verifier = await derivePasswordVerifier(password, saltBytes.buffer);
  await setMeta("webOfflineLogin", {
    accountId,
    identifier: identifier.trim().toLowerCase(),
    salt: saltBytes.buffer,
    verifier,
  } satisfies WebOfflineLogin);
}

export async function unlockWebOfflineAccount(
  identifier: string,
  password: string,
) {
  if (!canUseOfflineStore()) return false;
  const saved = await getMeta<WebOfflineLogin>("webOfflineLogin");
  if (!saved || saved.identifier !== identifier.trim().toLowerCase())
    return false;
  const candidate = new Uint8Array(
    await derivePasswordVerifier(password, saved.salt),
  );
  const expected = new Uint8Array(saved.verifier);
  if (candidate.length !== expected.length) return false;

  let difference = 0;
  for (let index = 0; index < candidate.length; index += 1) {
    difference |= candidate[index] ^ expected[index];
  }
  if (difference !== 0) return false;

  await setOfflineAccount(saved.accountId);
  return true;
}

export async function getOfflineAccount() {
  if (!canUseOfflineStore()) return undefined;
  return getMeta<string>("activeAccountId");
}

export async function cacheApiResponse<T>(url: string, value: T) {
  if (!canUseOfflineStore()) return;
  const accountId = await getOfflineAccount();
  if (!accountId) return;
  const key = `${accountId}:${url}`;
  const encrypted = await encrypt(value, key);
  const database = await openDatabase();
  try {
    const transaction = database.transaction(RESPONSE_STORE, "readwrite");
    await requestResult(
      transaction.objectStore(RESPONSE_STORE).put({
        key,
        accountId,
        updatedAt: new Date().toISOString(),
        ...encrypted,
      } satisfies StoredResponse),
    );
  } finally {
    database.close();
  }
}

export async function getCachedApiResponse<T>(url: string) {
  if (!canUseOfflineStore()) return undefined;
  const accountId = await getOfflineAccount();
  if (!accountId) return undefined;
  const key = `${accountId}:${url}`;
  const database = await openDatabase();
  try {
    const transaction = database.transaction(RESPONSE_STORE, "readonly");
    const stored = (await requestResult(
      transaction.objectStore(RESPONSE_STORE).get(key),
    )) as StoredResponse | undefined;
    return stored ? await decrypt<T>(stored, key) : undefined;
  } finally {
    database.close();
  }
}

export async function enqueueOfflineMutation(
  mutation: Omit<OfflineMutation, "id" | "accountId" | "createdAt">,
) {
  if (!canUseOfflineStore()) return undefined;
  const accountId = await getOfflineAccount();
  if (!accountId) return undefined;
  const item: OfflineMutation = {
    ...mutation,
    id: crypto.randomUUID(),
    accountId,
    createdAt: new Date().toISOString(),
  };
  const encrypted = await encrypt(item, `${accountId}:${item.id}`);
  const database = await openDatabase();
  try {
    const transaction = database.transaction(OUTBOX_STORE, "readwrite");
    await requestResult(
      transaction.objectStore(OUTBOX_STORE).put({
        id: item.id,
        accountId,
        createdAt: item.createdAt,
        ...encrypted,
      } satisfies StoredMutation),
    );
    return item;
  } finally {
    database.close();
  }
}

export async function listOfflineMutations() {
  if (!canUseOfflineStore()) return [];
  const accountId = await getOfflineAccount();
  if (!accountId) return [];
  const database = await openDatabase();
  try {
    const transaction = database.transaction(OUTBOX_STORE, "readonly");
    const stored = (await requestResult(
      transaction
        .objectStore(OUTBOX_STORE)
        .index("accountId")
        .getAll(accountId),
    )) as StoredMutation[];
    const mutations = await Promise.all(
      stored.map((item) =>
        decrypt<OfflineMutation>(item, `${accountId}:${item.id}`),
      ),
    );
    return mutations.sort((left, right) =>
      left.createdAt.localeCompare(right.createdAt),
    );
  } finally {
    database.close();
  }
}

export async function removeOfflineMutation(id: string) {
  if (!canUseOfflineStore()) return;
  const database = await openDatabase();
  try {
    const transaction = database.transaction(OUTBOX_STORE, "readwrite");
    await requestResult(transaction.objectStore(OUTBOX_STORE).delete(id));
  } finally {
    database.close();
  }
}

export async function clearOfflineAccount() {
  if (!canUseOfflineStore()) return;
  const database = await openDatabase();
  try {
    const transaction = database.transaction(
      [META_STORE, RESPONSE_STORE, OUTBOX_STORE],
      "readwrite",
    );
    transaction.objectStore(META_STORE).delete("activeAccountId");
    transaction.objectStore(META_STORE).delete("webOfflineLogin");
    transaction.objectStore(RESPONSE_STORE).clear();
    transaction.objectStore(OUTBOX_STORE).clear();
  } finally {
    database.close();
  }
}
