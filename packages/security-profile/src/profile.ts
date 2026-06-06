import type { SecurityCheckContext, SecurityCheckResult, SecurityProfile } from './types.ts';

export declare function createSecurityProfile(profile: SecurityProfile): SecurityProfile;
export declare function runSecurityChecks(
  profile: SecurityProfile,
  context: Omit<SecurityCheckContext, 'profile'>,
): ReadonlyArray<SecurityCheckResult>;
export declare const defaultSecurityProfile: SecurityProfile;
