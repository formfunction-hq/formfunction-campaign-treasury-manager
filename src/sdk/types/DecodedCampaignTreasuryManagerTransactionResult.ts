/**
 * NOTE: This is an auto-generated file. Don't edit it directly.
 */
import {
  DecodedInstructionAccount,
  GenericDecodedTransaction,
} from "@formfunction-hq/formfunction-program-shared";
import { IDL as CAMPAIGN_TREASURY_MANAGER_IDL } from "sdk/idl/CampaignTreasuryManager";
import CampaignTreasuryManagerInstructionName from "sdk/types/CampaignTreasuryManagerInstructionName";

const identity = <T>(val: T): T => val;

const ixMap = CAMPAIGN_TREASURY_MANAGER_IDL.instructionsMap ?? {};

const CloseDepositEscrowAccounts = (ixMap.closeDepositEscrow ?? []).map(
  identity
);

const CloseDepositRecordAccounts = (ixMap.closeDepositRecord ?? []).map(
  identity
);

const CloseEscrowAccounts = (ixMap.closeEscrow ?? []).map(identity);

const CreateDepositAccounts = (ixMap.createDeposit ?? []).map(identity);

const CreateDepositEscrowAccounts = (ixMap.createDepositEscrow ?? []).map(
  identity
);

const CreateEscrowAccounts = (ixMap.createEscrow ?? []).map(identity);

const PayOutFundsAccounts = (ixMap.payOutFunds ?? []).map(identity);

const ProcessDepositAccounts = (ixMap.processDeposit ?? []).map(identity);

const ProcessFullRefundAccounts = (ixMap.processFullRefund ?? []).map(identity);

const ProcessPartialRefundAccounts = (ixMap.processPartialRefund ?? []).map(
  identity
);

const UpdateEscrowAccounts = (ixMap.updateEscrow ?? []).map(identity);

const VetoPayoutPhaseAccounts = (ixMap.vetoPayoutPhase ?? []).map(identity);

type DecodedCampaignTreasuryManagerTransactionResult = {
  closeDepositEscrow?: GenericDecodedTransaction<CampaignTreasuryManagerInstructionName> & {
    accountsMap: {
      [Key in typeof CloseDepositEscrowAccounts[0]]: DecodedInstructionAccount;
    };
  };
  closeDepositRecord?: GenericDecodedTransaction<CampaignTreasuryManagerInstructionName> & {
    accountsMap: {
      [Key in typeof CloseDepositRecordAccounts[0]]: DecodedInstructionAccount;
    };
  };
  closeEscrow?: GenericDecodedTransaction<CampaignTreasuryManagerInstructionName> & {
    accountsMap: {
      [Key in typeof CloseEscrowAccounts[0]]: DecodedInstructionAccount;
    };
  };
  createDeposit?: GenericDecodedTransaction<CampaignTreasuryManagerInstructionName> & {
    accountsMap: {
      [Key in typeof CreateDepositAccounts[0]]: DecodedInstructionAccount;
    };
  };
  createDepositEscrow?: GenericDecodedTransaction<CampaignTreasuryManagerInstructionName> & {
    accountsMap: {
      [Key in typeof CreateDepositEscrowAccounts[0]]: DecodedInstructionAccount;
    };
  };
  createEscrow?: GenericDecodedTransaction<CampaignTreasuryManagerInstructionName> & {
    accountsMap: {
      [Key in typeof CreateEscrowAccounts[0]]: DecodedInstructionAccount;
    };
  };
  payOutFunds?: GenericDecodedTransaction<CampaignTreasuryManagerInstructionName> & {
    accountsMap: {
      [Key in typeof PayOutFundsAccounts[0]]: DecodedInstructionAccount;
    };
  };
  processDeposit?: GenericDecodedTransaction<CampaignTreasuryManagerInstructionName> & {
    accountsMap: {
      [Key in typeof ProcessDepositAccounts[0]]: DecodedInstructionAccount;
    };
  };
  processFullRefund?: GenericDecodedTransaction<CampaignTreasuryManagerInstructionName> & {
    accountsMap: {
      [Key in typeof ProcessFullRefundAccounts[0]]: DecodedInstructionAccount;
    };
  };
  processPartialRefund?: GenericDecodedTransaction<CampaignTreasuryManagerInstructionName> & {
    accountsMap: {
      [Key in typeof ProcessPartialRefundAccounts[0]]: DecodedInstructionAccount;
    };
  };
  updateEscrow?: GenericDecodedTransaction<CampaignTreasuryManagerInstructionName> & {
    accountsMap: {
      [Key in typeof UpdateEscrowAccounts[0]]: DecodedInstructionAccount;
    };
  };
  vetoPayoutPhase?: GenericDecodedTransaction<CampaignTreasuryManagerInstructionName> & {
    accountsMap: {
      [Key in typeof VetoPayoutPhaseAccounts[0]]: DecodedInstructionAccount;
    };
  };
};

export default DecodedCampaignTreasuryManagerTransactionResult;
