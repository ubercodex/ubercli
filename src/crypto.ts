import {
	createCipheriv,
	createDecipheriv,
	createHash,
	randomBytes,
} from 'crypto';
import { hostname, userInfo } from 'os';

const ALGORITHM = 'aes-256-gcm';
const ENCODING = 'hex';
const PREFIX = 'enc:';

function getMachineKey(): Buffer {
	const seed = `${hostname()}::${userInfo().username}::ubercli`;
	return createHash('sha256').update(seed).digest();
}

export function encryptKey(plaintext: string): string {
	if (!plaintext) return plaintext;
	if (plaintext.startsWith(PREFIX)) return plaintext;

	const key = getMachineKey();
	const iv = randomBytes(12);
	const cipher = createCipheriv(ALGORITHM, key, iv);

	const encrypted = Buffer.concat([
		cipher.update(plaintext, 'utf8'),
		cipher.final(),
	]);
	const authTag = cipher.getAuthTag();

	return (
		PREFIX +
		iv.toString(ENCODING) +
		':' +
		authTag.toString(ENCODING) +
		':' +
		encrypted.toString(ENCODING)
	);
}

export function decryptKey(stored: string): string {
	if (!stored) return stored;
	if (!stored.startsWith(PREFIX)) return stored;

	try {
		const parts = stored.slice(PREFIX.length).split(':');
		if (parts.length !== 3) return '';

		const [ivHex, authTagHex, encryptedHex] = parts;
		const key = getMachineKey();
		const iv = Buffer.from(ivHex, ENCODING);
		const authTag = Buffer.from(authTagHex, ENCODING);
		const encrypted = Buffer.from(encryptedHex, ENCODING);

		const decipher = createDecipheriv(ALGORITHM, key, iv);
		decipher.setAuthTag(authTag);

		return (
			decipher.update(encrypted).toString('utf8') +
			decipher.final('utf8')
		);
	} catch {
		return '';
	}
}

export function isEncrypted(value: string): boolean {
	return value.startsWith(PREFIX);
}
