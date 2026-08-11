import { createDirtyCoreDataset, discoverFelsReadOnly } from './fels1-core';
import { seedDatasetToPostgres } from './pg-fels-repository';

async function main() {
	const runtime = createDirtyCoreDataset();
	if (process.argv.includes('--db')) {
		const recordCounts = await seedDatasetToPostgres(runtime.records);
		console.log(JSON.stringify({ dataset: 'dirty-core', target: 'postgres', record_counts: recordCounts, discovery: discoverFelsReadOnly(runtime) }, null, 2));
		return;
	}
	console.log(JSON.stringify({ dataset: 'dirty-core', target: 'domain-runtime', discovery: discoverFelsReadOnly(runtime) }, null, 2));
}

void main().catch((error) => {
	console.error(error);
	process.exit(1);
});