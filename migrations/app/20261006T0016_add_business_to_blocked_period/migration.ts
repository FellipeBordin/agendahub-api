#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/25bfb96fcb6e347a757c6ee7abeddb0c0b149987ceecfddb22379ead6a22b315/contract';
import startContract from '../../snapshots/25bfb96fcb6e347a757c6ee7abeddb0c0b149987ceecfddb22379ead6a22b315/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/536c05054e1ecb098e857991b32d5226925ea05341840d9febb54a0356c93554/contract';
import endContract from '../../snapshots/536c05054e1ecb098e857991b32d5226925ea05341840d9febb54a0356c93554/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.addColumn({
        schema: 'public',
        table: 'BlockedPeriod',
        column: col('businessId', 'int4', { codecRef: { codecId: 'pg/int4@1' } }),
      }),
      this.createIndex({
        schema: 'public',
        table: 'BlockedPeriod',
        index: 'BlockedPeriod_businessId_idx_ae0ed511',
        columns: ['businessId'],
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'BlockedPeriod',
        foreignKey: {
          name: 'BlockedPeriod_businessId_fkey',
          columns: ['businessId'],
          references: { schema: 'public', table: 'Business', columns: ['id'] },
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
