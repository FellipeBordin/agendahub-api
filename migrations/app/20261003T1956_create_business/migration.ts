#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/35fc8521a5b61c4f63992879796ebdad1fdd1a6419932d2a3aa3315020d9df3c/contract';
import endContract from '../../snapshots/35fc8521a5b61c4f63992879796ebdad1fdd1a6419932d2a3aa3315020d9df3c/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/f1f859de32d6ebb9f1e30b89f08c1ca7661f1e186022955e828d98fe028e0960/contract';
import startContract from '../../snapshots/f1f859de32d6ebb9f1e30b89f08c1ca7661f1e186022955e828d98fe028e0960/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, fn, lit, primaryKey } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.createTable({
        schema: 'public',
        table: 'Business',
        columns: [
          col('active', 'bool', {
            notNull: true,
            default: lit(true),
            codecRef: { codecId: 'pg/bool@1' },
          }),
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('name', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('slug', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.addUnique({
        schema: 'public',
        table: 'Business',
        constraint: 'Business_slug_key',
        columns: ['slug'],
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
