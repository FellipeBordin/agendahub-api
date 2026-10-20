#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/828a01be8f5e19e1c8a30c2bae72b217a74bff7e702b1a1616aebfa64404e55b/contract';
import startContract from '../../snapshots/828a01be8f5e19e1c8a30c2bae72b217a74bff7e702b1a1616aebfa64404e55b/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/f1f859de32d6ebb9f1e30b89f08c1ca7661f1e186022955e828d98fe028e0960/contract';
import endContract from '../../snapshots/f1f859de32d6ebb9f1e30b89f08c1ca7661f1e186022955e828d98fe028e0960/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, fn, lit, primaryKey } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.createTable({
        schema: 'public',
        table: 'BlockedPeriod',
        columns: [
          col('allDay', 'bool', {
            notNull: true,
            default: lit(false),
            codecRef: { codecId: 'pg/bool@1' },
          }),
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('endAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('reason', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('startAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
        ],
        constraints: [primaryKey(['id'])],
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
