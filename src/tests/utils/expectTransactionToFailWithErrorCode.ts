import {
  assertUnreachable,
  Maybe,
} from "@formfunction-hq/formfunction-program-shared";
import {
  ConfirmOptions,
  Connection,
  sendAndConfirmTransaction,
  Signer,
  Transaction,
} from "@solana/web3.js";
import ProgramErrorName from "sdk/constants/ProgramErrorName";
import getErrorCodeFromErrorName from "tests/utils/getErrorCodeFromErrorName";

const SIGNATURE_VERIFICATION_FAILED = "SignatureVerificationFailed";
const CONSTRAINT_SEEDS = "ConstraintSeeds";
const CONSTRAINT_HAS_ONE = "ConstraintHasOne";
const MISSING_ACCOUNT = "MissingAccount";

type GeneralErrors =
  | typeof SIGNATURE_VERIFICATION_FAILED
  | typeof CONSTRAINT_SEEDS
  | typeof CONSTRAINT_HAS_ONE
  | typeof MISSING_ACCOUNT;

type TransactionErrors = GeneralErrors | ProgramErrorName;

function errorCodeToHexString(errorCode: number): string {
  return Number(errorCode).toString(16);
}

/**
 * Maps the general error to the specific RegExp pattern to match the error
 * which is thrown in the test. To figure this out for some new future error,
 * first use sendTransactionForTest in DEBUG mode and read the error logs.
 */
function getErrorMatcherForGeneralError(errorName: GeneralErrors): string {
  switch (errorName) {
    case SIGNATURE_VERIFICATION_FAILED:
      return "Signature verification failed";
    case MISSING_ACCOUNT:
      return "An account required by the instruction is missing";
    case CONSTRAINT_HAS_ONE:
      return errorCodeToHexString(2001);
    case CONSTRAINT_SEEDS:
      return errorCodeToHexString(2006);
    default:
      return assertUnreachable(errorName);
  }
}

export default async function expectTransactionToFailWithErrorCode({
  connection,
  errorName,
  options,
  signers,
  transaction,
}: {
  connection: Connection;
  errorName: TransactionErrors;
  options?: ConfirmOptions;
  signers: Array<Signer>;
  transaction: Transaction;
}): Promise<void> {
  let originalTransactionError: Maybe<any> = null;

  const tryCatchTransaction = async () => {
    try {
      await sendAndConfirmTransaction(
        connection,
        transaction,
        signers,
        options
      );
    } catch (e) {
      originalTransactionError = e;
      throw e;
    }
  };

  try {
    switch (errorName) {
      case SIGNATURE_VERIFICATION_FAILED:
      case CONSTRAINT_SEEDS:
      case CONSTRAINT_HAS_ONE:
      case MISSING_ACCOUNT: {
        await expect(tryCatchTransaction()).rejects.toThrow(
          getErrorMatcherForGeneralError(errorName)
        );
        break;
      }
      default: {
        const errorCode = getErrorCodeFromErrorName(errorName);
        await expect(tryCatchTransaction()).rejects.toThrow(
          errorCodeToHexString(errorCode)
        );
      }
    }
  } catch (err) {
    /**
     * If this catch block runs it means either the transaction did not fail
     * or the rejects.toThrow assertion failed, which probably means the
     * transaction failed in a way we didn't expect. If either of those happen
     * we log additional debugging info here.
     */
    if (originalTransactionError == null) {
      console.log(
        `Expected transaction to fail with error "${errorName}" but it did not fail.`
      );
    } else {
      console.log(
        `Received unexpected error in ${expectTransactionToFailWithErrorCode.name}, original error:`
      );
      console.log(originalTransactionError);
    }

    throw err;
  }
}
