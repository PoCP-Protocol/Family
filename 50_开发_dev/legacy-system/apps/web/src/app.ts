import { FELS_DOMAINS, FELS_EXPORT_ENDPOINTS, FELS_TRUTH } from '@family/fels-contracts';

export function renderFelsAdminShell() {
  return {
    title: 'FELS Legacy Operations',
    referenceImplementation: FELS_TRUTH.referenceImplementation,
    realBangyangSource: FELS_TRUTH.realBangyangSource,
    screens: [
      'Legacy Dashboard',
      'Customers',
      'Customer Detail',
      'Students',
      'Student detail',
      'Assessment detail',
      'Orders',
      'Enrollment Detail',
      'Consent Evidence',
    ],
    visualLanguage: 'internal education operations system',
    forbiddenNativeLanguage: ['GrowthProfile', 'GrowthPriority', 'Intervention', 'Outcome'],
    domains: FELS_DOMAINS,
    exportEndpoints: FELS_EXPORT_ENDPOINTS,
  } as const;
}