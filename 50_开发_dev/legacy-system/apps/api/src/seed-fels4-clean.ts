import { createFels4CleanDataset } from './fels1-core';
import { seedDatasetToPostgres } from './pg-fels-repository';

async function main() {
	const runtime = createFels4CleanDataset();
	if (process.argv.includes('--db')) {
		const recordCounts = await seedDatasetToPostgres(runtime.records);
		console.log(JSON.stringify({ dataset: 'fels4-clean', target: 'postgres', record_counts: recordCounts }, null, 2));
		return;
	}
	console.log(JSON.stringify({ dataset: 'fels4-clean', target: 'domain-runtime', record_counts: runtime.records.snapshots.at(-1)?.record_counts }, null, 2));
}

void main().catch((error) => {
	console.error(error);
	process.exit(1);
});
