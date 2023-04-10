use anchor_lang::prelude::*;

#[error_code]
pub enum CampaignTreasuryManagerError {
    #[msg("PublicKey check failed")]
    PublicKeyMismatch = 3000,
    #[msg("An account owner was incorrect")]
    IncorrectOwner,
    #[msg("An account was uninitialized")]
    UninitializedAccount,
    #[msg("You are missing at least one required signer")]
    MissingSigner,
    #[msg("Provided creator does not match the CampaignEscrow creator")]
    CreatorMismatch,
    #[msg("Provided authority does not match the CampaignEscrow authority")]
    AuthorityMismatch,
    #[msg("Payout phase settings are invalid")]
    InvalidPayoutPhases,
    #[msg("Cannot update CampaignEscrow after the campaign end time")]
    InvalidUpdateEscrow,
    #[msg("Cannot close CampaignEscrow unless all payouts are complete")]
    InvalidCloseEscrow,
    #[msg("Invalid treasury escrow account provided")]
    InvalidTreasuryEscrow,
    #[msg("UpdateEscrow input must include both the treasury_escrow_owner and treasury_mint if updating the escrow treasury")]
    InvalidTreasuryEscrowUpdate,
    #[msg("Invalid campaign_end_time provided")]
    InvalidCampaignEndTime,
    #[msg("Deposit escrow mint cannot be the native mint")]
    InvalidDepositEscrowMint,
    #[msg("Invalid deposit escrow account provided")]
    InvalidDepositEscrowAccount,
    #[msg("Invalid CPI invocation")]
    InvalidCpiInvocation,
    #[msg("Invalid CreateDepositEscrow instruction")]
    InvalidCreateDepositEscrowIx,
    #[msg("Invalid payout request")]
    InvalidPayoutRequest,
    #[msg("Deposit escrow account must be empty before it can be closed")]
    DepositEscrowAccountNotEmpty,
}
