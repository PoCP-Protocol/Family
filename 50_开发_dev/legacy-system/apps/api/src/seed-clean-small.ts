import { createCleanSmallDataset } from './fels1-core';

const runtime = createCleanSmallDataset();
console.log(JSON.stringify({ dataset: 'clean-small', record_counts: runtime.records.snapshots.at(-1)?.record_counts }, null, 2));