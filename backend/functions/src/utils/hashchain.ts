import * as crypto from 'crypto';

const GENESIS_HASH = 'GENESIS_BLOCK_AGRI_LOGIX_2026';

export function computeHash(previousHash: string, data: string): string {
  return crypto
    .createHash('sha256')
    .update(previousHash + data)
    .digest('hex');
}

export function getGenesisHash(): string {
  return crypto
    .createHash('sha256')
    .update(GENESIS_HASH)
    .digest('hex');
}

export function verifyChainIntegrity(
  logs: Array<{ previousHash: string; currentHash: string; data: string }>
): boolean {
  for (let i = 0; i < logs.length; i++) {
    const log = logs[i];
    const expectedHash = computeHash(
      i === 0 ? getGenesisHash() : logs[i - 1].currentHash,
      log.data
    );

    if (log.currentHash !== expectedHash) {
      return false;
    }

    if (i > 0 && log.previousHash !== logs[i - 1].currentHash) {
      return false;
    }
  }

  return true;
}
