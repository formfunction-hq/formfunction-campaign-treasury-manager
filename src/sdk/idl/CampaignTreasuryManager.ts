export type CampaignTreasuryManager = {
  accounts: [
    {
      name: "campaignEscrow";
      type: {
        fields: [
          { name: "bump"; type: "u8" },
          { name: "campaignUuid"; type: "string" },
          { name: "authority"; type: "publicKey" },
          { name: "creator"; type: "publicKey" },
          { name: "payoutWallet"; type: "publicKey" },
          { name: "treasury"; type: { defined: "Treasury" } },
          {
            name: "depositEscrowInfos";
            type: { vec: { defined: "DepositEscrowInfo" } };
          },
          { name: "campaignEndTime"; type: "i64" },
          { name: "depositCount"; type: "u64" },
          { name: "processedDepositCount"; type: "u64" },
          { name: "closedDepositRecordCount"; type: "u64" },
          { name: "payoutsReady"; type: "bool" },
          { name: "payoutPhases"; type: { defined: "PayoutPhases" } }
        ];
        kind: "struct";
      };
    },
    { name: "depositEscrow"; type: { fields: []; kind: "struct" } },
    {
      name: "depositRecord";
      type: {
        fields: [
          { name: "bump"; type: "u8" },
          { name: "mint"; type: "publicKey" },
          { name: "depositor"; type: "publicKey" },
          { name: "depositEscrowMint"; type: "publicKey" },
          { name: "initialDepositAmount"; type: "u64" },
          { name: "processedDepositAmount"; type: "u64" },
          { name: "depositProcessed"; type: "bool" }
        ];
        kind: "struct";
      };
    },
    { name: "treasuryEscrow"; type: { fields: []; kind: "struct" } }
  ];
  errors: [
    { code: 9000; msg: "PublicKey check failed"; name: "PublicKeyMismatch" },
    {
      code: 9001;
      msg: "An account owner was incorrect";
      name: "IncorrectOwner";
    },
    {
      code: 9002;
      msg: "An account was uninitialized";
      name: "UninitializedAccount";
    },
    {
      code: 9003;
      msg: "You are missing at least one required signer";
      name: "MissingSigner";
    },
    {
      code: 9004;
      msg: "Provided creator does not match the CampaignEscrow creator";
      name: "CreatorMismatch";
    },
    {
      code: 9005;
      msg: "Provided authority does not match the CampaignEscrow authority";
      name: "AuthorityMismatch";
    },
    {
      code: 9006;
      msg: "Payout phase settings are invalid";
      name: "InvalidPayoutPhases";
    },
    {
      code: 9007;
      msg: "Cannot update CampaignEscrow after the campaign end time";
      name: "InvalidUpdateEscrow";
    },
    {
      code: 9008;
      msg: "Cannot close CampaignEscrow unless all payouts are complete";
      name: "InvalidCloseEscrow";
    },
    {
      code: 9009;
      msg: "Invalid treasury escrow account provided";
      name: "InvalidTreasuryEscrow";
    },
    {
      code: 9010;
      msg: "UpdateEscrow input must include both the treasury_escrow_owner and treasury_mint if updating the escrow treasury";
      name: "InvalidTreasuryEscrowUpdate";
    },
    {
      code: 9011;
      msg: "Invalid campaign_end_time provided";
      name: "InvalidCampaignEndTime";
    },
    {
      code: 9012;
      msg: "Deposit escrow mint cannot be the native mint";
      name: "InvalidDepositEscrowMint";
    },
    {
      code: 9013;
      msg: "Invalid deposit escrow account provided";
      name: "InvalidDepositEscrowAccount";
    },
    { code: 9014; msg: "Invalid CPI invocation"; name: "InvalidCpiInvocation" },
    {
      code: 9015;
      msg: "Invalid CreateDepositEscrow instruction";
      name: "InvalidCreateDepositEscrowIx";
    },
    { code: 9016; msg: "Invalid payout request"; name: "InvalidPayoutRequest" },
    {
      code: 9017;
      msg: "Deposit escrow account must be empty before it can be closed";
      name: "DepositEscrowAccountNotEmpty";
    }
  ];
  instructions: [
    {
      accounts: [
        { isMut: false; isSigner: false; name: "campaignEscrow" },
        { isMut: true; isSigner: false; name: "depositEscrow" },
        { isMut: false; isSigner: false; name: "depositEscrowMint" },
        { isMut: true; isSigner: false; name: "receiver" },
        { isMut: false; isSigner: true; name: "authority" },
        { isMut: false; isSigner: false; name: "tokenProgram" },
        { isMut: false; isSigner: false; name: "systemProgram" }
      ];
      args: [];
      name: "closeDepositEscrow";
    },
    {
      accounts: [
        { isMut: true; isSigner: false; name: "campaignEscrow" },
        { isMut: false; isSigner: false; name: "treasuryEscrow" },
        { isMut: true; isSigner: true; name: "payer" }
      ];
      args: [];
      name: "closeDepositRecord";
    },
    {
      accounts: [
        { isMut: true; isSigner: false; name: "campaignEscrow" },
        {
          docs: ["This account is closed manually in the ix handler."];
          isMut: true;
          isSigner: false;
          name: "treasuryEscrow";
        },
        { isMut: true; isSigner: false; name: "receiver" },
        { isMut: true; isSigner: true; name: "payer" },
        { isMut: false; isSigner: true; name: "authority" },
        { isMut: false; isSigner: false; name: "creator" },
        { isMut: false; isSigner: false; name: "tokenProgram" },
        { isMut: false; isSigner: false; name: "systemProgram" }
      ];
      args: [];
      name: "closeEscrow";
    },
    {
      accounts: [
        { isMut: true; isSigner: false; name: "campaignEscrow" },
        { isMut: true; isSigner: false; name: "depositRecord" },
        {
          docs: [
            "This account may be the treasury_escrow or a DepositEscrow account, depending",
            "on the nature of the deposit. The client SDK will pass in the right account,",
            "which will be validated in the instruction handler below."
          ];
          isMut: true;
          isSigner: false;
          name: "depositEscrow";
        },
        { isMut: false; isSigner: false; name: "depositEscrowMint" },
        { isMut: true; isSigner: true; name: "depositor" },
        { isMut: true; isSigner: false; name: "depositorPaymentAccount" },
        { isMut: false; isSigner: false; name: "mint" },
        { isMut: false; isSigner: false; name: "systemProgram" },
        { isMut: false; isSigner: false; name: "tokenProgram" },
        { isMut: false; isSigner: false; name: "instructionSysvarAccount" }
      ];
      args: [{ name: "depositAmount"; type: "u64" }];
      name: "createDeposit";
    },
    {
      accounts: [
        { isMut: true; isSigner: false; name: "campaignEscrow" },
        { isMut: false; isSigner: true; name: "authority" },
        {
          docs: [
            "This does not use Anchor init because we want to manually initialize this",
            "account as a token account in some cases (this is done in the instruction)."
          ];
          isMut: true;
          isSigner: false;
          name: "depositEscrow";
        },
        { isMut: false; isSigner: false; name: "depositEscrowMint" },
        { isMut: false; isSigner: false; name: "systemProgram" },
        { isMut: false; isSigner: false; name: "tokenProgram" },
        { isMut: false; isSigner: false; name: "rent" }
      ];
      args: [{ name: "depositEscrowBump"; type: "u8" }];
      name: "createDepositEscrow";
    },
    {
      accounts: [
        { isMut: true; isSigner: false; name: "campaignEscrow" },
        { isMut: true; isSigner: true; name: "payer" },
        { isMut: false; isSigner: false; name: "authority" },
        { isMut: false; isSigner: false; name: "creator" },
        { isMut: false; isSigner: false; name: "treasuryMint" },
        { isMut: true; isSigner: false; name: "treasuryEscrow" },
        { isMut: true; isSigner: false; name: "payoutWallet" },
        { isMut: false; isSigner: false; name: "payoutWalletOwner" },
        { isMut: false; isSigner: false; name: "tokenProgram" },
        { isMut: false; isSigner: false; name: "ataProgram" },
        { isMut: false; isSigner: false; name: "systemProgram" },
        { isMut: false; isSigner: false; name: "rent" }
      ];
      args: [
        { name: "campaignUuid"; type: "string" },
        { name: "treasuryBump"; type: "u8" },
        {
          name: "campaignEscrowInput";
          type: { defined: "CreateCampaignEscrowInput" };
        }
      ];
      name: "createEscrow";
    },
    {
      accounts: [
        { isMut: true; isSigner: false; name: "campaignEscrow" },
        { isMut: true; isSigner: false; name: "treasuryEscrow" },
        { isMut: true; isSigner: true; name: "payer" },
        { isMut: true; isSigner: false; name: "payoutWallet" },
        { isMut: false; isSigner: false; name: "tokenProgram" },
        { isMut: false; isSigner: false; name: "systemProgram" }
      ];
      args: [];
      name: "payOutFunds";
    },
    {
      accounts: [
        { isMut: true; isSigner: false; name: "campaignEscrow" },
        { isMut: false; isSigner: false; name: "treasuryEscrow" },
        { isMut: true; isSigner: true; name: "payer" }
      ];
      args: [];
      name: "processDeposit";
    },
    {
      accounts: [
        { isMut: true; isSigner: false; name: "campaignEscrow" },
        { isMut: false; isSigner: false; name: "treasuryEscrow" },
        { isMut: true; isSigner: true; name: "payer" }
      ];
      args: [];
      name: "processFullRefund";
    },
    {
      accounts: [
        { isMut: true; isSigner: false; name: "campaignEscrow" },
        { isMut: false; isSigner: false; name: "treasuryEscrow" },
        { isMut: true; isSigner: true; name: "payer" }
      ];
      args: [];
      name: "processPartialRefund";
    },
    {
      accounts: [
        { isMut: true; isSigner: false; name: "campaignEscrow" },
        { isMut: true; isSigner: true; name: "payer" },
        { isMut: false; isSigner: true; name: "authority" },
        { isMut: false; isSigner: false; name: "creator" },
        { isMut: false; isSigner: false; name: "treasuryMint" },
        { isMut: true; isSigner: false; name: "treasuryEscrow" },
        { isMut: true; isSigner: false; name: "payoutWallet" },
        { isMut: false; isSigner: false; name: "payoutWalletOwner" },
        { isMut: false; isSigner: false; name: "tokenProgram" },
        { isMut: false; isSigner: false; name: "ataProgram" },
        { isMut: false; isSigner: false; name: "systemProgram" },
        { isMut: false; isSigner: false; name: "rent" }
      ];
      args: [
        { name: "campaignUuid"; type: "string" },
        { name: "treasuryBump"; type: "u8" },
        {
          name: "campaignEscrowInput";
          type: { defined: "UpdateCampaignEscrowInput" };
        }
      ];
      name: "updateEscrow";
    },
    {
      accounts: [
        { isMut: true; isSigner: false; name: "campaignEscrow" },
        { isMut: true; isSigner: true; name: "payer" },
        { isMut: false; isSigner: true; name: "authority" }
      ];
      args: [{ name: "payoutPhaseIndex"; type: "u8" }];
      name: "vetoPayoutPhase";
    }
  ];
  instructionsMap: {
    closeDepositEscrow: [
      "campaignEscrow",
      "depositEscrow",
      "depositEscrowMint",
      "receiver",
      "authority",
      "tokenProgram",
      "systemProgram"
    ];
    closeDepositRecord: ["campaignEscrow", "treasuryEscrow", "payer"];
    closeEscrow: [
      "campaignEscrow",
      "treasuryEscrow",
      "receiver",
      "payer",
      "authority",
      "creator",
      "tokenProgram",
      "systemProgram"
    ];
    createDeposit: [
      "campaignEscrow",
      "depositRecord",
      "depositEscrow",
      "depositEscrowMint",
      "depositor",
      "depositorPaymentAccount",
      "mint",
      "systemProgram",
      "tokenProgram",
      "instructionSysvarAccount"
    ];
    createDepositEscrow: [
      "campaignEscrow",
      "authority",
      "depositEscrow",
      "depositEscrowMint",
      "systemProgram",
      "tokenProgram",
      "rent"
    ];
    createEscrow: [
      "campaignEscrow",
      "payer",
      "authority",
      "creator",
      "treasuryMint",
      "treasuryEscrow",
      "payoutWallet",
      "payoutWalletOwner",
      "tokenProgram",
      "ataProgram",
      "systemProgram",
      "rent"
    ];
    payOutFunds: [
      "campaignEscrow",
      "treasuryEscrow",
      "payer",
      "payoutWallet",
      "tokenProgram",
      "systemProgram"
    ];
    processDeposit: ["campaignEscrow", "treasuryEscrow", "payer"];
    processFullRefund: ["campaignEscrow", "treasuryEscrow", "payer"];
    processPartialRefund: ["campaignEscrow", "treasuryEscrow", "payer"];
    updateEscrow: [
      "campaignEscrow",
      "payer",
      "authority",
      "creator",
      "treasuryMint",
      "treasuryEscrow",
      "payoutWallet",
      "payoutWalletOwner",
      "tokenProgram",
      "ataProgram",
      "systemProgram",
      "rent"
    ];
    vetoPayoutPhase: ["campaignEscrow", "payer", "authority"];
  };
  name: "campaign_treasury_manager";
  types: [
    {
      name: "CreateCampaignEscrowInput";
      type: {
        fields: [
          { name: "campaignEndTime"; type: "i64" },
          {
            name: "nonVotingPayoutPhases";
            type: { vec: { defined: "NonVotingPayoutPhaseInput" } };
          },
          {
            name: "votingPayoutPhases";
            type: { vec: { defined: "VotingPayoutPhaseInput" } };
          }
        ];
        kind: "struct";
      };
    },
    {
      name: "UpdateCampaignEscrowInput";
      type: {
        fields: [
          { name: "authority"; type: { option: "publicKey" } },
          { name: "creator"; type: { option: "publicKey" } },
          { name: "campaignEndTime"; type: { option: "i64" } },
          {
            name: "nonVotingPayoutPhases";
            type: { option: { vec: { defined: "NonVotingPayoutPhaseInput" } } };
          },
          {
            name: "votingPayoutPhases";
            type: { option: { vec: { defined: "VotingPayoutPhaseInput" } } };
          }
        ];
        kind: "struct";
      };
    },
    {
      name: "DepositEscrowInfo";
      type: {
        fields: [
          { name: "depositEscrowBump"; type: "u8" },
          { name: "mint"; type: "publicKey" },
          { name: "closed"; type: "bool" }
        ];
        kind: "struct";
      };
    },
    {
      name: "Treasury";
      type: {
        fields: [
          { name: "bump"; type: "u8" },
          { name: "treasuryMint"; type: "publicKey" },
          { name: "treasuryEscrow"; type: "publicKey" },
          { name: "totalFunds"; type: "u64" }
        ];
        kind: "struct";
      };
    },
    {
      name: "PayoutPhases";
      type: {
        fields: [
          {
            name: "nonVotingPayoutPhases";
            type: { vec: { defined: "NonVotingPayoutPhase" } };
          },
          {
            name: "votingPayoutPhases";
            type: { vec: { defined: "VotingPayoutPhase" } };
          }
        ];
        kind: "struct";
      };
    },
    {
      name: "SharedPayoutPhaseFields";
      type: {
        fields: [
          { name: "index"; type: "u8" },
          { name: "payoutBasisPoints"; type: "u16" },
          { name: "payoutTime"; type: "i64" },
          { name: "refundDeadline"; type: "i64" },
          { name: "description"; type: "string" }
        ];
        kind: "struct";
      };
    },
    {
      name: "NonVotingPayoutPhase";
      type: {
        fields: [
          {
            name: "sharedFields";
            type: { defined: "SharedPayoutPhaseFields" };
          },
          { name: "isPaidOut"; type: "bool" },
          { name: "isVetoedByAuthority"; type: "bool" }
        ];
        kind: "struct";
      };
    },
    {
      name: "NonVotingPayoutPhaseInput";
      type: {
        fields: [
          { name: "sharedFields"; type: { defined: "SharedPayoutPhaseFields" } }
        ];
        kind: "struct";
      };
    },
    {
      name: "VotingPayoutPhase";
      type: {
        fields: [
          {
            name: "sharedFields";
            type: { defined: "SharedPayoutPhaseFields" };
          },
          { name: "isPaidOut"; type: "bool" },
          { name: "isVetoedByAuthority"; type: "bool" },
          { name: "votingStartTime"; type: "i64" },
          { name: "vetoVotes"; type: "u64" },
          { name: "voteBasisPointsVetoThreshold"; type: "u64" }
        ];
        kind: "struct";
      };
    },
    {
      name: "VotingPayoutPhaseInput";
      type: {
        fields: [
          {
            name: "sharedFields";
            type: { defined: "SharedPayoutPhaseFields" };
          },
          { name: "votingStartTime"; type: "i64" },
          { name: "vetoVotes"; type: "u64" },
          { name: "voteBasisPointsVetoThreshold"; type: "u64" }
        ];
        kind: "struct";
      };
    },
    {
      name: "PayoutPhaseEnum";
      type: {
        kind: "enum";
        variants: [
          { fields: [{ defined: "&'aVotingPayoutPhase" }]; name: "Voting" },
          {
            fields: [{ defined: "&'aNonVotingPayoutPhase" }];
            name: "NonVoting";
          }
        ];
      };
    }
  ];
  version: "0.0.7";
};
export const IDL: CampaignTreasuryManager = {
  accounts: [
    {
      name: "campaignEscrow",
      type: {
        fields: [
          { name: "bump", type: "u8" },
          { name: "campaignUuid", type: "string" },
          { name: "authority", type: "publicKey" },
          { name: "creator", type: "publicKey" },
          { name: "payoutWallet", type: "publicKey" },
          { name: "treasury", type: { defined: "Treasury" } },
          {
            name: "depositEscrowInfos",
            type: { vec: { defined: "DepositEscrowInfo" } },
          },
          { name: "campaignEndTime", type: "i64" },
          { name: "depositCount", type: "u64" },
          { name: "processedDepositCount", type: "u64" },
          { name: "closedDepositRecordCount", type: "u64" },
          { name: "payoutsReady", type: "bool" },
          { name: "payoutPhases", type: { defined: "PayoutPhases" } },
        ],
        kind: "struct",
      },
    },
    { name: "depositEscrow", type: { fields: [], kind: "struct" } },
    {
      name: "depositRecord",
      type: {
        fields: [
          { name: "bump", type: "u8" },
          { name: "mint", type: "publicKey" },
          { name: "depositor", type: "publicKey" },
          { name: "depositEscrowMint", type: "publicKey" },
          { name: "initialDepositAmount", type: "u64" },
          { name: "processedDepositAmount", type: "u64" },
          { name: "depositProcessed", type: "bool" },
        ],
        kind: "struct",
      },
    },
    { name: "treasuryEscrow", type: { fields: [], kind: "struct" } },
  ],
  errors: [
    { code: 9000, msg: "PublicKey check failed", name: "PublicKeyMismatch" },
    {
      code: 9001,
      msg: "An account owner was incorrect",
      name: "IncorrectOwner",
    },
    {
      code: 9002,
      msg: "An account was uninitialized",
      name: "UninitializedAccount",
    },
    {
      code: 9003,
      msg: "You are missing at least one required signer",
      name: "MissingSigner",
    },
    {
      code: 9004,
      msg: "Provided creator does not match the CampaignEscrow creator",
      name: "CreatorMismatch",
    },
    {
      code: 9005,
      msg: "Provided authority does not match the CampaignEscrow authority",
      name: "AuthorityMismatch",
    },
    {
      code: 9006,
      msg: "Payout phase settings are invalid",
      name: "InvalidPayoutPhases",
    },
    {
      code: 9007,
      msg: "Cannot update CampaignEscrow after the campaign end time",
      name: "InvalidUpdateEscrow",
    },
    {
      code: 9008,
      msg: "Cannot close CampaignEscrow unless all payouts are complete",
      name: "InvalidCloseEscrow",
    },
    {
      code: 9009,
      msg: "Invalid treasury escrow account provided",
      name: "InvalidTreasuryEscrow",
    },
    {
      code: 9010,
      msg: "UpdateEscrow input must include both the treasury_escrow_owner and treasury_mint if updating the escrow treasury",
      name: "InvalidTreasuryEscrowUpdate",
    },
    {
      code: 9011,
      msg: "Invalid campaign_end_time provided",
      name: "InvalidCampaignEndTime",
    },
    {
      code: 9012,
      msg: "Deposit escrow mint cannot be the native mint",
      name: "InvalidDepositEscrowMint",
    },
    {
      code: 9013,
      msg: "Invalid deposit escrow account provided",
      name: "InvalidDepositEscrowAccount",
    },
    { code: 9014, msg: "Invalid CPI invocation", name: "InvalidCpiInvocation" },
    {
      code: 9015,
      msg: "Invalid CreateDepositEscrow instruction",
      name: "InvalidCreateDepositEscrowIx",
    },
    { code: 9016, msg: "Invalid payout request", name: "InvalidPayoutRequest" },
    {
      code: 9017,
      msg: "Deposit escrow account must be empty before it can be closed",
      name: "DepositEscrowAccountNotEmpty",
    },
  ],
  instructions: [
    {
      accounts: [
        { isMut: false, isSigner: false, name: "campaignEscrow" },
        { isMut: true, isSigner: false, name: "depositEscrow" },
        { isMut: false, isSigner: false, name: "depositEscrowMint" },
        { isMut: true, isSigner: false, name: "receiver" },
        { isMut: false, isSigner: true, name: "authority" },
        { isMut: false, isSigner: false, name: "tokenProgram" },
        { isMut: false, isSigner: false, name: "systemProgram" },
      ],
      args: [],
      name: "closeDepositEscrow",
    },
    {
      accounts: [
        { isMut: true, isSigner: false, name: "campaignEscrow" },
        { isMut: false, isSigner: false, name: "treasuryEscrow" },
        { isMut: true, isSigner: true, name: "payer" },
      ],
      args: [],
      name: "closeDepositRecord",
    },
    {
      accounts: [
        { isMut: true, isSigner: false, name: "campaignEscrow" },
        {
          docs: ["This account is closed manually in the ix handler."],
          isMut: true,
          isSigner: false,
          name: "treasuryEscrow",
        },
        { isMut: true, isSigner: false, name: "receiver" },
        { isMut: true, isSigner: true, name: "payer" },
        { isMut: false, isSigner: true, name: "authority" },
        { isMut: false, isSigner: false, name: "creator" },
        { isMut: false, isSigner: false, name: "tokenProgram" },
        { isMut: false, isSigner: false, name: "systemProgram" },
      ],
      args: [],
      name: "closeEscrow",
    },
    {
      accounts: [
        { isMut: true, isSigner: false, name: "campaignEscrow" },
        { isMut: true, isSigner: false, name: "depositRecord" },
        {
          docs: [
            "This account may be the treasury_escrow or a DepositEscrow account, depending",
            "on the nature of the deposit. The client SDK will pass in the right account,",
            "which will be validated in the instruction handler below.",
          ],
          isMut: true,
          isSigner: false,
          name: "depositEscrow",
        },
        { isMut: false, isSigner: false, name: "depositEscrowMint" },
        { isMut: true, isSigner: true, name: "depositor" },
        { isMut: true, isSigner: false, name: "depositorPaymentAccount" },
        { isMut: false, isSigner: false, name: "mint" },
        { isMut: false, isSigner: false, name: "systemProgram" },
        { isMut: false, isSigner: false, name: "tokenProgram" },
        { isMut: false, isSigner: false, name: "instructionSysvarAccount" },
      ],
      args: [{ name: "depositAmount", type: "u64" }],
      name: "createDeposit",
    },
    {
      accounts: [
        { isMut: true, isSigner: false, name: "campaignEscrow" },
        { isMut: false, isSigner: true, name: "authority" },
        {
          docs: [
            "This does not use Anchor init because we want to manually initialize this",
            "account as a token account in some cases (this is done in the instruction).",
          ],
          isMut: true,
          isSigner: false,
          name: "depositEscrow",
        },
        { isMut: false, isSigner: false, name: "depositEscrowMint" },
        { isMut: false, isSigner: false, name: "systemProgram" },
        { isMut: false, isSigner: false, name: "tokenProgram" },
        { isMut: false, isSigner: false, name: "rent" },
      ],
      args: [{ name: "depositEscrowBump", type: "u8" }],
      name: "createDepositEscrow",
    },
    {
      accounts: [
        { isMut: true, isSigner: false, name: "campaignEscrow" },
        { isMut: true, isSigner: true, name: "payer" },
        { isMut: false, isSigner: false, name: "authority" },
        { isMut: false, isSigner: false, name: "creator" },
        { isMut: false, isSigner: false, name: "treasuryMint" },
        { isMut: true, isSigner: false, name: "treasuryEscrow" },
        { isMut: true, isSigner: false, name: "payoutWallet" },
        { isMut: false, isSigner: false, name: "payoutWalletOwner" },
        { isMut: false, isSigner: false, name: "tokenProgram" },
        { isMut: false, isSigner: false, name: "ataProgram" },
        { isMut: false, isSigner: false, name: "systemProgram" },
        { isMut: false, isSigner: false, name: "rent" },
      ],
      args: [
        { name: "campaignUuid", type: "string" },
        { name: "treasuryBump", type: "u8" },
        {
          name: "campaignEscrowInput",
          type: { defined: "CreateCampaignEscrowInput" },
        },
      ],
      name: "createEscrow",
    },
    {
      accounts: [
        { isMut: true, isSigner: false, name: "campaignEscrow" },
        { isMut: true, isSigner: false, name: "treasuryEscrow" },
        { isMut: true, isSigner: true, name: "payer" },
        { isMut: true, isSigner: false, name: "payoutWallet" },
        { isMut: false, isSigner: false, name: "tokenProgram" },
        { isMut: false, isSigner: false, name: "systemProgram" },
      ],
      args: [],
      name: "payOutFunds",
    },
    {
      accounts: [
        { isMut: true, isSigner: false, name: "campaignEscrow" },
        { isMut: false, isSigner: false, name: "treasuryEscrow" },
        { isMut: true, isSigner: true, name: "payer" },
      ],
      args: [],
      name: "processDeposit",
    },
    {
      accounts: [
        { isMut: true, isSigner: false, name: "campaignEscrow" },
        { isMut: false, isSigner: false, name: "treasuryEscrow" },
        { isMut: true, isSigner: true, name: "payer" },
      ],
      args: [],
      name: "processFullRefund",
    },
    {
      accounts: [
        { isMut: true, isSigner: false, name: "campaignEscrow" },
        { isMut: false, isSigner: false, name: "treasuryEscrow" },
        { isMut: true, isSigner: true, name: "payer" },
      ],
      args: [],
      name: "processPartialRefund",
    },
    {
      accounts: [
        { isMut: true, isSigner: false, name: "campaignEscrow" },
        { isMut: true, isSigner: true, name: "payer" },
        { isMut: false, isSigner: true, name: "authority" },
        { isMut: false, isSigner: false, name: "creator" },
        { isMut: false, isSigner: false, name: "treasuryMint" },
        { isMut: true, isSigner: false, name: "treasuryEscrow" },
        { isMut: true, isSigner: false, name: "payoutWallet" },
        { isMut: false, isSigner: false, name: "payoutWalletOwner" },
        { isMut: false, isSigner: false, name: "tokenProgram" },
        { isMut: false, isSigner: false, name: "ataProgram" },
        { isMut: false, isSigner: false, name: "systemProgram" },
        { isMut: false, isSigner: false, name: "rent" },
      ],
      args: [
        { name: "campaignUuid", type: "string" },
        { name: "treasuryBump", type: "u8" },
        {
          name: "campaignEscrowInput",
          type: { defined: "UpdateCampaignEscrowInput" },
        },
      ],
      name: "updateEscrow",
    },
    {
      accounts: [
        { isMut: true, isSigner: false, name: "campaignEscrow" },
        { isMut: true, isSigner: true, name: "payer" },
        { isMut: false, isSigner: true, name: "authority" },
      ],
      args: [{ name: "payoutPhaseIndex", type: "u8" }],
      name: "vetoPayoutPhase",
    },
  ],
  instructionsMap: {
    closeDepositEscrow: [
      "campaignEscrow",
      "depositEscrow",
      "depositEscrowMint",
      "receiver",
      "authority",
      "tokenProgram",
      "systemProgram",
    ],
    closeDepositRecord: ["campaignEscrow", "treasuryEscrow", "payer"],
    closeEscrow: [
      "campaignEscrow",
      "treasuryEscrow",
      "receiver",
      "payer",
      "authority",
      "creator",
      "tokenProgram",
      "systemProgram",
    ],
    createDeposit: [
      "campaignEscrow",
      "depositRecord",
      "depositEscrow",
      "depositEscrowMint",
      "depositor",
      "depositorPaymentAccount",
      "mint",
      "systemProgram",
      "tokenProgram",
      "instructionSysvarAccount",
    ],
    createDepositEscrow: [
      "campaignEscrow",
      "authority",
      "depositEscrow",
      "depositEscrowMint",
      "systemProgram",
      "tokenProgram",
      "rent",
    ],
    createEscrow: [
      "campaignEscrow",
      "payer",
      "authority",
      "creator",
      "treasuryMint",
      "treasuryEscrow",
      "payoutWallet",
      "payoutWalletOwner",
      "tokenProgram",
      "ataProgram",
      "systemProgram",
      "rent",
    ],
    payOutFunds: [
      "campaignEscrow",
      "treasuryEscrow",
      "payer",
      "payoutWallet",
      "tokenProgram",
      "systemProgram",
    ],
    processDeposit: ["campaignEscrow", "treasuryEscrow", "payer"],
    processFullRefund: ["campaignEscrow", "treasuryEscrow", "payer"],
    processPartialRefund: ["campaignEscrow", "treasuryEscrow", "payer"],
    updateEscrow: [
      "campaignEscrow",
      "payer",
      "authority",
      "creator",
      "treasuryMint",
      "treasuryEscrow",
      "payoutWallet",
      "payoutWalletOwner",
      "tokenProgram",
      "ataProgram",
      "systemProgram",
      "rent",
    ],
    vetoPayoutPhase: ["campaignEscrow", "payer", "authority"],
  },
  name: "campaign_treasury_manager",
  types: [
    {
      name: "CreateCampaignEscrowInput",
      type: {
        fields: [
          { name: "campaignEndTime", type: "i64" },
          {
            name: "nonVotingPayoutPhases",
            type: { vec: { defined: "NonVotingPayoutPhaseInput" } },
          },
          {
            name: "votingPayoutPhases",
            type: { vec: { defined: "VotingPayoutPhaseInput" } },
          },
        ],
        kind: "struct",
      },
    },
    {
      name: "UpdateCampaignEscrowInput",
      type: {
        fields: [
          { name: "authority", type: { option: "publicKey" } },
          { name: "creator", type: { option: "publicKey" } },
          { name: "campaignEndTime", type: { option: "i64" } },
          {
            name: "nonVotingPayoutPhases",
            type: { option: { vec: { defined: "NonVotingPayoutPhaseInput" } } },
          },
          {
            name: "votingPayoutPhases",
            type: { option: { vec: { defined: "VotingPayoutPhaseInput" } } },
          },
        ],
        kind: "struct",
      },
    },
    {
      name: "DepositEscrowInfo",
      type: {
        fields: [
          { name: "depositEscrowBump", type: "u8" },
          { name: "mint", type: "publicKey" },
          { name: "closed", type: "bool" },
        ],
        kind: "struct",
      },
    },
    {
      name: "Treasury",
      type: {
        fields: [
          { name: "bump", type: "u8" },
          { name: "treasuryMint", type: "publicKey" },
          { name: "treasuryEscrow", type: "publicKey" },
          { name: "totalFunds", type: "u64" },
        ],
        kind: "struct",
      },
    },
    {
      name: "PayoutPhases",
      type: {
        fields: [
          {
            name: "nonVotingPayoutPhases",
            type: { vec: { defined: "NonVotingPayoutPhase" } },
          },
          {
            name: "votingPayoutPhases",
            type: { vec: { defined: "VotingPayoutPhase" } },
          },
        ],
        kind: "struct",
      },
    },
    {
      name: "SharedPayoutPhaseFields",
      type: {
        fields: [
          { name: "index", type: "u8" },
          { name: "payoutBasisPoints", type: "u16" },
          { name: "payoutTime", type: "i64" },
          { name: "refundDeadline", type: "i64" },
          { name: "description", type: "string" },
        ],
        kind: "struct",
      },
    },
    {
      name: "NonVotingPayoutPhase",
      type: {
        fields: [
          {
            name: "sharedFields",
            type: { defined: "SharedPayoutPhaseFields" },
          },
          { name: "isPaidOut", type: "bool" },
          { name: "isVetoedByAuthority", type: "bool" },
        ],
        kind: "struct",
      },
    },
    {
      name: "NonVotingPayoutPhaseInput",
      type: {
        fields: [
          {
            name: "sharedFields",
            type: { defined: "SharedPayoutPhaseFields" },
          },
        ],
        kind: "struct",
      },
    },
    {
      name: "VotingPayoutPhase",
      type: {
        fields: [
          {
            name: "sharedFields",
            type: { defined: "SharedPayoutPhaseFields" },
          },
          { name: "isPaidOut", type: "bool" },
          { name: "isVetoedByAuthority", type: "bool" },
          { name: "votingStartTime", type: "i64" },
          { name: "vetoVotes", type: "u64" },
          { name: "voteBasisPointsVetoThreshold", type: "u64" },
        ],
        kind: "struct",
      },
    },
    {
      name: "VotingPayoutPhaseInput",
      type: {
        fields: [
          {
            name: "sharedFields",
            type: { defined: "SharedPayoutPhaseFields" },
          },
          { name: "votingStartTime", type: "i64" },
          { name: "vetoVotes", type: "u64" },
          { name: "voteBasisPointsVetoThreshold", type: "u64" },
        ],
        kind: "struct",
      },
    },
    {
      name: "PayoutPhaseEnum",
      type: {
        kind: "enum",
        variants: [
          { fields: [{ defined: "&'aVotingPayoutPhase" }], name: "Voting" },
          {
            fields: [{ defined: "&'aNonVotingPayoutPhase" }],
            name: "NonVoting",
          },
        ],
      },
    },
  ],
  version: "0.0.7",
};
