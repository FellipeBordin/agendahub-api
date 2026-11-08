#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/ab2a4971071549f33e013a89685eb696afe37a82982c84862b11460b889e5fd9/contract';
import endContract from '../../snapshots/ab2a4971071549f33e013a89685eb696afe37a82982c84862b11460b889e5fd9/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/d2f98075de915527c802c7fb23525d4c0cd84bb80fed04a587a492f8eef9412c/contract';
import startContract from '../../snapshots/d2f98075de915527c802c7fb23525d4c0cd84bb80fed04a587a492f8eef9412c/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, fn, primaryKey } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.createTable({
        schema: 'public',
        table: 'PushSubscription',
        columns: [
          col('auth', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('businessId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('endpoint', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('p256dh', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('userId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.addUnique({
        schema: 'public',
        table: 'PushSubscription',
        constraint: 'PushSubscription_endpoint_key',
        columns: ['endpoint'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'PushSubscription',
        index: 'PushSubscription_businessId_idx_ae0ed511',
        columns: ['businessId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'PushSubscription',
        index: 'PushSubscription_userId_idx_a489d58a',
        columns: ['userId'],
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'PushSubscription',
        foreignKey: {
          name: 'PushSubscription_userId_fkey',
          columns: ['userId'],
          references: { schema: 'public', table: 'User', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'PushSubscription',
        foreignKey: {
          name: 'PushSubscription_businessId_fkey',
          columns: ['businessId'],
          references: { schema: 'public', table: 'Business', columns: ['id'] },
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
