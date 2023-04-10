import {
  AnchorWallet,
  Environment,
  ixToTx,
  PdaResult,
} from "@formfunction-hq/formfunction-program-shared";
import { AnchorProvider, BN, Idl, Program } from "@project-serum/anchor";
import { Connection, PublicKey, Transaction } from "@solana/web3.js";
import {
  CAMPAIGN_TREASURY_MANAGER_IDL,
  CampaignTreasuryManagerProgram,
} from "sdk/idl";
import { CampaignTreasuryManager } from "sdk/idl/CampaignTreasuryManager";
import closeDepositEscrowIx from "sdk/instructions/closeDepositEscrowIx";
import closeDepositRecordIx from "sdk/instructions/closeDepositRecordIx";
import closeEscrowIx from "sdk/instructions/closeEscrowIx";
import createDepositEscrowIx from "sdk/instructions/createDepositEscrowIx";
import createDepositIx from "sdk/instructions/createDepositIx";
import createEscrowIx from "sdk/instructions/createEscrowIx";
import payOutFundsIx from "sdk/instructions/payOutFundsIx";
import processDepositIx from "sdk/instructions/processDepositIx";
import processFullRefundIx from "sdk/instructions/processFullRefundIx";
import processPartialRefundIx from "sdk/instructions/processPartialRefundIx";
import updateEscrowIx from "sdk/instructions/updateEscrowIx";
import vetoPayoutPhaseIx from "sdk/instructions/vetoPayoutPhaseIx";
import findCampaignEscrowPda from "sdk/pdas/findCampaignEscrowPda";
import CampaignEscrowAccount from "sdk/types/CampaignEscrowAccount";
import CreateCampaignEscrowInput from "sdk/types/CreateCampaignEscrowInput";
import UpdateCampaignEscrowInput from "sdk/types/UpdateCampaignEscrowInput";
import getProgramIdsFromEnvironment from "sdk/utils/getProgramIdsFromEnvironment";

export default class CampaignTreasuryManagerSdk {
  private _connection: Connection;
  private _idl: Idl = CAMPAIGN_TREASURY_MANAGER_IDL;
  private _program: CampaignTreasuryManagerProgram;
  private _programId: PublicKey;
  private _botSignerAuthority: PublicKey;

  constructor({
    connection,
    environment,
    wallet,
  }: {
    connection: Connection;
    environment: Environment;
    wallet: AnchorWallet;
  }) {
    this._connection = connection;

    const provider = new AnchorProvider(connection, wallet, {
      preflightCommitment: "recent",
    });

    const programIds = getProgramIdsFromEnvironment(environment);

    this._botSignerAuthority = programIds.botSignerAuthority;
    this._programId = programIds.programId;

    this._program = new Program<CampaignTreasuryManager>(
      CAMPAIGN_TREASURY_MANAGER_IDL,
      programIds.programId,
      provider
    );
  }

  get connection(): Connection {
    return this._connection;
  }

  get idl(): Idl {
    return this._idl;
  }

  get program(): CampaignTreasuryManagerProgram {
    return this._program;
  }

  get botSignerAuthority(): PublicKey {
    return this._botSignerAuthority;
  }

  get programId(): PublicKey {
    return this._programId;
  }

  async findCampaignEscrowPda(campaignUuid: string): Promise<PdaResult> {
    return findCampaignEscrowPda(campaignUuid, this.programId);
  }

  async fetchCampaignEscrowAccount(
    address: PublicKey
  ): Promise<CampaignEscrowAccount> {
    const account = await this.program.account.campaignEscrow.fetch(address);
    return account as any as CampaignEscrowAccount;
  }

  async fetchCampaignEscrowAccountWithCampaignUuid(
    campaignUuid: string
  ): Promise<CampaignEscrowAccount> {
    const [address] = await this.findCampaignEscrowPda(campaignUuid);
    const account = await this.program.account.campaignEscrow.fetch(address);
    return account as any as CampaignEscrowAccount;
  }

  async createEscrowTx(
    {
      authority,
      creator,
      payer,
      payoutWalletOwner,
      treasuryMint,
    }: {
      authority: PublicKey;
      creator: PublicKey;
      payer: PublicKey;
      payoutWalletOwner: PublicKey;
      treasuryMint: PublicKey;
    },
    {
      campaignUuid,
      createCampaignEscrowInput,
    }: {
      campaignUuid: string;
      createCampaignEscrowInput: CreateCampaignEscrowInput;
    }
  ): Promise<Transaction> {
    const ix = await createEscrowIx(
      {
        authority,
        creator,
        payer,
        payoutWalletOwner,
        treasuryMint,
      },
      {
        campaignUuid,
        createCampaignEscrowInput,
        program: this.program,
      }
    );
    return ixToTx(ix);
  }

  async updateEscrowTx(
    {
      authority,
      creator,
      payer,
      payoutWalletOwner,
      treasuryMint,
    }: {
      authority: PublicKey;
      creator: PublicKey;
      payer: PublicKey;
      payoutWalletOwner: PublicKey;
      treasuryMint: PublicKey;
    },
    {
      campaignUuid,
      updateCampaignEscrowInput,
    }: {
      campaignUuid: string;
      updateCampaignEscrowInput: UpdateCampaignEscrowInput;
    }
  ): Promise<Transaction> {
    const ix = await updateEscrowIx(
      {
        authority,
        creator,
        payer,
        payoutWalletOwner,
        treasuryMint,
      },
      {
        campaignUuid,
        program: this.program,
        updateCampaignEscrowInput,
      }
    );
    return ixToTx(ix);
  }

  async createDepositEscrowTx(
    {
      depositEscrowMint,
    }: {
      depositEscrowMint: PublicKey;
    },
    {
      campaignUuid,
    }: {
      campaignUuid: string;
    }
  ): Promise<Transaction> {
    const ix = await createDepositEscrowIx(
      {
        depositEscrowMint,
      },
      {
        campaignUuid,
        program: this.program,
      }
    );
    return ixToTx(ix);
  }

  async closeDepositEscrowTx(
    {
      authority,
      depositEscrowMint,
      receiver,
    }: {
      authority: PublicKey;
      depositEscrowMint: PublicKey;
      receiver: PublicKey;
    },
    {
      campaignUuid,
    }: {
      campaignUuid: string;
    }
  ): Promise<Transaction> {
    const ix = await closeDepositEscrowIx(
      {
        authority,
        depositEscrowMint,
        receiver,
      },
      {
        campaignUuid,
        program: this.program,
      }
    );
    return ixToTx(ix);
  }

  async closeEscrowTx(
    {
      authority,
      creator,
      receiver,
      payer,
    }: {
      authority: PublicKey;
      creator: PublicKey;
      payer: PublicKey;
      receiver: PublicKey;
    },
    {
      campaignUuid,
    }: {
      campaignUuid: string;
    }
  ): Promise<Transaction> {
    const ix = await closeEscrowIx(
      {
        authority,
        creator,
        payer,
        receiver,
      },
      {
        campaignUuid,
        program: this.program,
      }
    );
    return ixToTx(ix);
  }

  async vetoPayoutPhaseTx(
    {
      authority,
      payer,
    }: {
      authority: PublicKey;
      payer: PublicKey;
    },
    {
      campaignUuid,
      payoutPhaseIndex,
    }: {
      campaignUuid: string;
      payoutPhaseIndex: number;
    }
  ): Promise<Transaction> {
    const ix = await vetoPayoutPhaseIx(
      {
        authority,
        payer,
      },
      {
        campaignUuid,
        payoutPhaseIndex,
        program: this.program,
      }
    );
    return ixToTx(ix);
  }

  async createDepositTx(
    {
      depositor,
      mint,
      saleCurrencyMint,
    }: { depositor: PublicKey; mint: PublicKey; saleCurrencyMint: PublicKey },
    {
      campaignUuid,
      depositAmount,
    }: {
      campaignUuid: string;
      depositAmount: BN;
    }
  ): Promise<Transaction> {
    const ix = await createDepositIx(
      {
        depositor,
        mint,
        saleCurrencyMint,
      },
      {
        campaignUuid,
        depositAmount,
        program: this.program,
      }
    );
    return ixToTx(ix);
  }

  async processDepositTx(
    { payer }: { payer: PublicKey },
    {
      campaignUuid,
    }: {
      campaignUuid: string;
    }
  ): Promise<Transaction> {
    const ix = await processDepositIx(
      {
        payer,
      },
      {
        campaignUuid,
        program: this.program,
      }
    );
    return ixToTx(ix);
  }

  async processPartialRefundTx(
    { payer }: { payer: PublicKey },
    {
      campaignUuid,
    }: {
      campaignUuid: string;
    }
  ): Promise<Transaction> {
    const ix = await processPartialRefundIx(
      {
        payer,
      },
      {
        campaignUuid,
        program: this.program,
      }
    );
    return ixToTx(ix);
  }

  async processRefundTx(
    { payer }: { payer: PublicKey },
    {
      campaignUuid,
    }: {
      campaignUuid: string;
    }
  ): Promise<Transaction> {
    const ix = await processFullRefundIx(
      {
        payer,
      },
      {
        campaignUuid,
        program: this.program,
      }
    );
    return ixToTx(ix);
  }

  async payOutFundsTx(
    { payer }: { payer: PublicKey },
    {
      campaignUuid,
    }: {
      campaignUuid: string;
    }
  ): Promise<Transaction> {
    const ix = await payOutFundsIx(
      {
        payer,
      },
      {
        campaignUuid,
        program: this.program,
      }
    );
    return ixToTx(ix);
  }

  async closeDepositRecordTx(
    { payer }: { payer: PublicKey },
    {
      campaignUuid,
    }: {
      campaignUuid: string;
    }
  ): Promise<Transaction> {
    const ix = await closeDepositRecordIx(
      {
        payer,
      },
      {
        campaignUuid,
        program: this.program,
      }
    );
    return ixToTx(ix);
  }
}
