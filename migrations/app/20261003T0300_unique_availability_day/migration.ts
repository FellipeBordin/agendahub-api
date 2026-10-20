#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/638f5a43b9530157d47d4f86654ea81ecd09c76081bb8618e4a477e766d9e300/contract';
import startContract from '../../snapshots/638f5a43b9530157d47d4f86654ea81ecd09c76081bb8618e4a477e766d9e300/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/828a01be8f5e19e1c8a30c2bae72b217a74bff7e702b1a1616aebfa64404e55b/contract';
import endContract from '../../snapshots/828a01be8f5e19e1c8a30c2bae72b217a74bff7e702b1a1616aebfa64404e55b/contract.json' with { type: 'json' };
import { Migration, MigrationCLI } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.addUnique({
        schema: 'public',
        table: 'Availability',
        constraint: 'Availability_dayOfWeek_key',
        columns: ['dayOfWeek'],
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
