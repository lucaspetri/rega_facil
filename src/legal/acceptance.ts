import { LEGAL_VERSION } from './documents';

export const hasAcceptedCurrentLegal = (
  acceptedVersion: string | null | undefined,
): boolean => acceptedVersion === LEGAL_VERSION;
