import { createFlmDirtyWorldDataset, discoverFelsReadOnly, rejectSemanticPollution } from './fels1-core';
import { seedDatasetToPostgres } from './pg-fels-repository';

async function main() {
	const runtime = createFlmDirtyWorldDataset();
	const pollution = rejectSemanticPollution(runtime);
	if (process.argv.includes('--db')) {
		const recordCounts = await seedDatasetToPostgres(runtime.records);
		console.log(JSON.stringify({ dataset: 'flm-dirty-world', target: 'postgres', record_counts: recordCounts, discovery: discoverFelsReadOnly(runtime), pollution }, null, 2));
		return;
	}
	console.log(JSON.stringify({ dataset: 'flm-dirty-world', target: 'domain-runtime', record_counts: runtime.records.snapshots.at(-1)?.record_counts, discovery: discoverFelsReadOnly(runtime), pollution }, null, 2));
}

void main().catch((error) => {
	console.error(error);
	process.exit(1);
});
