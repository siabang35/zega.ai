/**
 * @zega/zeroclaw-bridge — Version Matrix & Compatibility Detection
 *
 * Implements version checking and semantic version comparison
 * against ZeroClaw daemon releases to ensure the bridge only
 * communicates with supported gateway versions.
 */

import { VersionCompatibility } from './types.js';

/** Minimum supported ZeroClaw gateway version. */
export const MIN_SUPPORTED_VERSION = '0.8.0';

/** Recommended / target ZeroClaw gateway version. */
export const TARGET_SUPPORTED_VERSION = '0.8.3';

/** Maximum supported ZeroClaw gateway version (exclusive major/minor cap). */
export const MAX_SUPPORTED_VERSION = '0.9.0-alpha';

/**
 * Parse a SemVer string into [major, minor, patch, prerelease].
 * Example: 'v0.8.3-zeroclaw' -> [0, 8, 3, 'zeroclaw']
 */
export function parseSemVer(versionStr: string): [number, number, number, string | null] {
  const cleaned = versionStr.replace(/^v/i, '').trim();
  const match = cleaned.match(/^(\d+)\.(\d+)\.(\d+)(?:-(.+))?$/);

  if (!match) {
    return [0, 0, 0, null];
  }

  return [
    parseInt(match[1], 10),
    parseInt(match[2], 10),
    parseInt(match[3], 10),
    match[4] || null,
  ];
}

/**
 * Compare two SemVer tuples. Returns -1 if v1 < v2, 0 if v1 == v2, 1 if v1 > v2.
 */
export function compareSemVer(v1Str: string, v2Str: string): number {
  const [maj1, min1, pat1] = parseSemVer(v1Str);
  const [maj2, min2, pat2] = parseSemVer(v2Str);

  if (maj1 !== maj2) return maj1 < maj2 ? -1 : 1;
  if (min1 !== min2) return min1 < min2 ? -1 : 1;
  if (pat1 !== pat2) return pat1 < pat2 ? -1 : 1;

  return 0;
}

/**
 * Check whether a detected daemon version string is compatible with this bridge.
 *
 * @param versionStr - Version string returned by /health or /api/status (e.g. "v0.8.3")
 */
export function checkVersionCompatibility(versionStr: string | null | undefined): VersionCompatibility {
  if (!versionStr) {
    return {
      minVersion: MIN_SUPPORTED_VERSION,
      maxVersion: MAX_SUPPORTED_VERSION,
      currentVersion: null,
      compatible: false,
      message: 'Unknown version: daemon did not report a version string.',
    };
  }

  const cleanVersion = versionStr.replace(/^v/i, '').split('-')[0]; // Extract "0.8.3"

  const isAtLeastMin = compareSemVer(cleanVersion, MIN_SUPPORTED_VERSION) >= 0;
  const isBelowMax = compareSemVer(cleanVersion, MAX_SUPPORTED_VERSION.split('-')[0]) < 0;

  const compatible = isAtLeastMin && isBelowMax;

  let message = `Version ${versionStr} is compatible with ZeroClaw Bridge (Range: >=${MIN_SUPPORTED_VERSION} <${MAX_SUPPORTED_VERSION}).`;

  if (!isAtLeastMin) {
    message = `Version ${versionStr} is too old. Minimum required is ${MIN_SUPPORTED_VERSION}.`;
  } else if (!isBelowMax) {
    message = `Version ${versionStr} is higher than supported max (${MAX_SUPPORTED_VERSION}). Breaking API changes may occur.`;
  }

  return {
    minVersion: MIN_SUPPORTED_VERSION,
    maxVersion: MAX_SUPPORTED_VERSION,
    currentVersion: versionStr,
    compatible,
    message,
  };
}
