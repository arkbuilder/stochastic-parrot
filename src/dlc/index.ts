/**
 * DLC Extension System — public API barrel export.
 *
 * Import everything you need from 'src/dlc' instead of reaching
 * into individual files.
 */

// Types
export type {
  DlcStatus,
  DlcContent,
  DlcManifest,
  DlcPack,
} from './types';

// Registry
export {
  registerDlcPack,
  unregisterDlcPack,
  getDlcPack,
  listDlcManifests,
  listDlcPacks,
  isDlcRegistered,
  getDlcCount,
  clearDlcRegistry,
} from './dlc-registry';

// Unlock logic
export {
  BASE_CAMPAIGN_ISLANDS,
  isBaseCampaignComplete,
  getDlcStatus,
  getAllDlcStatuses,
  getAvailableDlcIds,
} from './dlc-unlock';

// Driver (validate + merge)
export type {
  DlcValidationError,
  MergedGameData,
} from './dlc-driver';

export {
  validateDlcPack,
  mergeDlcContent,
} from './dlc-driver';
