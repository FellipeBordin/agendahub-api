#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/021a7c9a7f66d038ef9d0c437d26c83b2d3749a297939f0674ef90786600be9d/contract';
import startContract from '../../snapshots/021a7c9a7f66d038ef9d0c437d26c83b2d3749a297939f0674ef90786600be9d/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/d2f98075de915527c802c7fb23525d4c0cd84bb80fed04a587a492f8eef9412c/contract';
import endContract from '../../snapshots/d2f98075de915527c802c7fb23525d4c0cd84bb80fed04a587a492f8eef9412c/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, fn, primaryKey } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.createTable({
        schema: 'public',
        table: 'Notification',
        columns: [
          col('appointmentId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('businessId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('clientName', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('readAt', 'timestamptz', { codecRef: { codecId: 'pg/timestamptz-string@1' } }),
          col('serviceName', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('startAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.addUnique({
        schema: 'public',
        table: 'Notification',
        constraint: 'Notification_businessId_appointmentId_key',
        columns: ['businessId', 'appointmentId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'Notification',
        index: 'Notification_appointmentId_idx_682a8b58',
        columns: ['appointmentId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'Notification',
        index: 'Notification_businessId_idx_ae0ed511',
        columns: ['businessId'],
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'Notification',
        foreignKey: {
          name: 'Notification_businessId_fkey',
          columns: ['businessId'],
          references: { schema: 'public', table: 'Business', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'Notification',
        foreignKey: {
          name: 'Notification_appointmentId_fkey',
          columns: ['appointmentId'],
          references: { schema: 'public', table: 'Appointment', columns: ['id'] },
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
