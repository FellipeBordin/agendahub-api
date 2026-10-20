#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/35fc8521a5b61c4f63992879796ebdad1fdd1a6419932d2a3aa3315020d9df3c/contract';
import startContract from '../../snapshots/35fc8521a5b61c4f63992879796ebdad1fdd1a6419932d2a3aa3315020d9df3c/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/3bccf462e9c6a8818f1087e84b42f478e2e55a6e4125eff58e4734cb6f9db251/contract';
import endContract from '../../snapshots/3bccf462e9c6a8818f1087e84b42f478e2e55a6e4125eff58e4734cb6f9db251/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.addColumn({
        schema: 'public',
        table: 'Service',
        column: col('businessId', 'int4', { codecRef: { codecId: 'pg/int4@1' } }),
      }),
      this.createIndex({
        schema: 'public',
        table: 'Service',
        index: 'Service_businessId_idx_ae0ed511',
        columns: ['businessId'],
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'Service',
        foreignKey: {
          name: 'Service_businessId_fkey',
          columns: ['businessId'],
          references: { schema: 'public', table: 'Business', columns: ['id'] },
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
