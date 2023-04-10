import { CAMPAIGN_TREASURY_MANAGER_IDL } from "sdk/idl";

const ErrorCodes = CAMPAIGN_TREASURY_MANAGER_IDL["errors"].map((e) => e.name);

// This is a union type of all the error code names.
type ProgramErrorName = typeof ErrorCodes[0];

export default ProgramErrorName;
