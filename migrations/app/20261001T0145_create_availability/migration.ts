#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/5aa42209b3b0e3bf9bcf7ae7922d5240ad6ee830efaf7c63431e1cd3589bcee7/contract';
import startContract from '../../snapshots/5aa42209b3b0e3bf9bcf7ae7922d5240ad6ee830efaf7c63431e1cd3589bcee7/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/638f5a43b9530157d47d4f86654ea81ecd09c76081bb8618e4a477e766d9e300/contract';
import endContract from '../../snapshots/638f5a43b9530157d47d4f86654ea81ecd09c76081bb8618e4a477e766d9e300/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, lit, primaryKey } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.createTable({
        schema: 'public',
        table: 'Availability',
        columns: [
          col('active', 'bool', {
            notNull: true,
            default: lit(true),
            codecRef: { codecId: 'pg/bool@1' },
          }),
          col('dayOfWeek', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('endTime', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('startTime', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
