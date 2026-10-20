#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/07c9316807307dc37fee88abd9abc8b61ee7c44c04526ba4fffd8d0232d6fb67/contract';
import endContract from '../../snapshots/07c9316807307dc37fee88abd9abc8b61ee7c44c04526ba4fffd8d0232d6fb67/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/bd7928ca93265dee3c80e991d42246bf21cea966708887230de996f0a13ce23c/contract';
import startContract from '../../snapshots/bd7928ca93265dee3c80e991d42246bf21cea966708887230de996f0a13ce23c/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.addColumn({
        schema: 'public',
        table: 'Availability',
        column: col('businessId', 'int4', { codecRef: { codecId: 'pg/int4@1' } }),
      }),
      this.createIndex({
        schema: 'public',
        table: 'Availability',
        index: 'Availability_businessId_idx_ae0ed511',
        columns: ['businessId'],
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'Availability',
        foreignKey: {
          name: 'Availability_businessId_fkey',
          columns: ['businessId'],
          references: { schema: 'public', table: 'Business', columns: ['id'] },
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
