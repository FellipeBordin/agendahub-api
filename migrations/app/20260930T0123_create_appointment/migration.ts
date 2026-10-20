#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/5aa42209b3b0e3bf9bcf7ae7922d5240ad6ee830efaf7c63431e1cd3589bcee7/contract';
import endContract from '../../snapshots/5aa42209b3b0e3bf9bcf7ae7922d5240ad6ee830efaf7c63431e1cd3589bcee7/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/edaed145b941517b0db3ce7288c9a8ee064fbe626b920d8c731c00f33f7d1fb4/contract';
import startContract from '../../snapshots/edaed145b941517b0db3ce7288c9a8ee064fbe626b920d8c731c00f33f7d1fb4/contract.json' with { type: 'json' };
import {
  Migration,
  MigrationCLI,
  checkExpression,
  col,
  fn,
  lit,
  primaryKey,
} from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.createTable({
        schema: 'public',
        table: 'Appointment',
        columns: [
          col('clientName', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('clientPhone', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
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
          col('serviceId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('startAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('status', 'text', {
            notNull: true,
            default: lit('SCHEDULED'),
            codecRef: { codecId: 'pg/text@1' },
          }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression(
            'Appointment_status_check_78cb05f7',
            "\"status\" IN ('SCHEDULED', 'COMPLETED', 'CANCELED')",
          ),
        ],
      }),
      this.createIndex({
        schema: 'public',
        table: 'Appointment',
        index: 'Appointment_serviceId_idx_b5d9acbf',
        columns: ['serviceId'],
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'Appointment',
        foreignKey: {
          name: 'Appointment_serviceId_fkey',
          columns: ['serviceId'],
          references: { schema: 'public', table: 'Service', columns: ['id'] },
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
