import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import {
  createPrincipalSoulGoldenSet,
  createPrincipalSoulTrainingRecords,
  evaluatePrincipalSoulGoldenSet,
  evaluatePrincipalSoulTrainingRecords,
  exportPrincipalSoulGoldenSetJsonl,
  exportPrincipalSoulTrainingJsonl,
} from '../dist/index.js';

const packageRoot = resolve(import.meta.dirname, '..');
const reportDir = resolve(packageRoot, '..', '..', 'reports', 'principal-ai');
const jsonlPath = resolve(reportDir, 'famili-principal-soul-golden-set.jsonl');
const reportPath = resolve(reportDir, 'famili-principal-soul-golden-set-eval.json');
const sftPath = resolve(reportDir, 'famili-principal-soul-sft.jsonl');
const preferencePath = resolve(reportDir, 'famili-principal-soul-preference.jsonl');
const trainingReportPath = resolve(reportDir, 'famili-principal-soul-training-eval.json');

const goldenSet = createPrincipalSoulGoldenSet();
const report = evaluatePrincipalSoulGoldenSet(goldenSet);
const trainingRecords = createPrincipalSoulTrainingRecords(goldenSet);
const trainingReport = evaluatePrincipalSoulTrainingRecords(trainingRecords);

mkdirSync(dirname(jsonlPath), { recursive: true });
writeFileSync(jsonlPath, exportPrincipalSoulGoldenSetJsonl(goldenSet), 'utf8');
writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
writeFileSync(sftPath, exportPrincipalSoulTrainingJsonl('sft', trainingRecords), 'utf8');
writeFileSync(preferencePath, exportPrincipalSoulTrainingJsonl('preference', trainingRecords), 'utf8');
writeFileSync(trainingReportPath, `${JSON.stringify(trainingReport, null, 2)}\n`, 'utf8');

console.log(JSON.stringify({ jsonlPath, reportPath, sftPath, preferencePath, trainingReportPath, report, trainingReport }, null, 2));