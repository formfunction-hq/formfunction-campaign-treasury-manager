import ProgramErrorName from "sdk/constants/ProgramErrorName";
import { CAMPAIGN_TREASURY_MANAGER_IDL } from "sdk/idl";

export default function getErrorCodeFromErrorName(
  errorName: ProgramErrorName
): number {
  const errors = CAMPAIGN_TREASURY_MANAGER_IDL["errors"];
  const idlError = errors.find(({ name }) => name === errorName);
  if (idlError == null) {
    throw new Error(`Couldn't find ${errorName} in IDL errors.`);
  }
  return idlError.code;
}
