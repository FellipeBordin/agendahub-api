#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/25bfb96fcb6e347a757c6ee7abeddb0c0b149987ceecfddb22379ead6a22b315/contract';
import endContract from '../../snapshots/25bfb96fcb6e347a757c6ee7abeddb0c0b149987ceecfddb22379ead6a22b315/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/7c19967c1fd7f89517f491815d4ccbf610b613df344a69a4bb687d07a63a554a/contract';
import startContract from '../../snapshots/7c19967c1fd7f89517f491815d4ccbf610b613df344a69a4bb687d07a63a554a/contract.json' with { type: 'json' };
import { Migration, MigrationCLI } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.dropConstraint({
        schema: 'public',
        table: 'Availability',
        constraint: 'Availability_dayOfWeek_key',
      }),
      this.addUnique({
        schema: 'public',
        table: 'Availability',
        constraint: 'Availability_businessId_dayOfWeek_key',
        columns: ['businessId', 'dayOfWeek'],
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
