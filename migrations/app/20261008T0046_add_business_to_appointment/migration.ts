#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/b1ae9b79a0ec5e7989892900d5960a38675dbe22079bf17526dc053a059c3954/contract';
import startContract from '../../snapshots/b1ae9b79a0ec5e7989892900d5960a38675dbe22079bf17526dc053a059c3954/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/b5b09c328cc6c944e06dc34700a9e82c3d46241a4d4fc6963ada8124664acc20/contract';
import endContract from '../../snapshots/b5b09c328cc6c944e06dc34700a9e82c3d46241a4d4fc6963ada8124664acc20/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.addColumn({
        schema: 'public',
        table: 'Appointment',
        column: col('businessId', 'int4', { codecRef: { codecId: 'pg/int4@1' } }),
      }),
      this.createIndex({
        schema: 'public',
        table: 'Appointment',
        index: 'Appointment_businessId_idx_ae0ed511',
        columns: ['businessId'],
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'Appointment',
        foreignKey: {
          name: 'Appointment_businessId_fkey',
          columns: ['businessId'],
          references: { schema: 'public', table: 'Business', columns: ['id'] },
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
