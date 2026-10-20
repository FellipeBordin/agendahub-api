#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/021a7c9a7f66d038ef9d0c437d26c83b2d3749a297939f0674ef90786600be9d/contract';
import endContract from '../../snapshots/021a7c9a7f66d038ef9d0c437d26c83b2d3749a297939f0674ef90786600be9d/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/e337b4f857c84b431447640939b6da638628105f050c4fe0822721591c6766ef/contract';
import startContract from '../../snapshots/e337b4f857c84b431447640939b6da638628105f050c4fe0822721591c6766ef/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, fn, lit, primaryKey } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.createTable({
        schema: 'public',
        table: 'User',
        columns: [
          col('active', 'bool', {
            notNull: true,
            default: lit(true),
            codecRef: { codecId: 'pg/bool@1' },
          }),
          col('businessId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('email', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('name', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('passwordHash', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.addUnique({
        schema: 'public',
        table: 'User',
        constraint: 'User_email_key',
        columns: ['email'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'User',
        index: 'User_businessId_idx_ae0ed511',
        columns: ['businessId'],
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'User',
        foreignKey: {
          name: 'User_businessId_fkey',
          columns: ['businessId'],
          references: { schema: 'public', table: 'Business', columns: ['id'] },
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
