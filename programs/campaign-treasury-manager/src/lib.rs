use anchor_lang::prelude::*;

#[cfg(not(feature = "no-entrypoint"))]
use solana_security_txt::security_txt;

pub mod constants;
pub mod errors;
pub mod instructions;
pub mod state;
pub mod utils;

pub use errors::CampaignTreasuryManagerError;
pub use instructions::*;
pub use state::*;
pub use utils::*;
pub use validate_cpi_invocation::*;

#[cfg(not(feature = "no-entrypoint"))]
security_txt! {
    name: "Formfunction Campaign Treasury Manager Program",
    project_url: "https://formfunction.xyz",
    source_code: "https://github.com/formfunction-hq",
    contacts: "email:matt@formfunction.xyz",
    policy: "https://formfunction.notion.site/Security-Policy-4ca262c13fe3452087b356ef1fd165e9",
    preferred_languages: "en",
    auditors: "n/a",
    acknowledgements: "Thanks for visiting."
}

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

#[program]
pub mod campaign_treasury_manager {
    use super::*;

    // Create a CampaignEscrow account.
    pub fn create_escrow(
        ctx: Context<CreateEscrow>,
        campaign_uuid: String,
        treasury_bump: u8,
        campaign_escrow_input: CreateCampaignEscrowInput,
    ) -> Result<()> {
        handle_create_escrow(ctx, campaign_uuid, treasury_bump, campaign_escrow_input)
    }

    // Create a deposit escrow account for a CampaignEscrow. These accounts are for
    // all deposit currencies which do not already match the main CampaignEscrow
    // Treasury currency.
    pub fn create_deposit_escrow(
        ctx: Context<CreateDepositEscrow>,
        deposit_escrow_bump: u8,
    ) -> Result<()> {
        handle_create_deposit_escrow(ctx, deposit_escrow_bump)
    }

    // Close a DepositEscrow account. Only the authority can do this.
    pub fn close_deposit_escrow(ctx: Context<CloseDepositEscrow>) -> Result<()> {
        handle_close_deposit_escrow(ctx)
    }

    // Update a CampaignEscrow account. The authority or creator can do this.
    pub fn update_escrow(
        ctx: Context<UpdateEscrow>,
        campaign_uuid: String,
        treasury_bump: u8,
        campaign_escrow_input: UpdateCampaignEscrowInput,
    ) -> Result<()> {
        handle_update_escrow(ctx, campaign_uuid, treasury_bump, campaign_escrow_input)
    }

    // Close a CampaignEscrow account. Only the authority can do this. This ix
    // closes the CampaignEscrow and associated TreasuryEscrow accounts.
    pub fn close_escrow(ctx: Context<CloseEscrow>) -> Result<()> {
        handle_close_escrow(ctx)
    }

    // Create a deposit. This is step 1 of the 2 step deposit flow.
    pub fn create_deposit(ctx: Context<CreateDeposit>, deposit_amount: u64) -> Result<()> {
        // Depositing will create a DepositRecord account which records
        // the deposit for the campaign supporter. This account will also
        // store the mint of the associated NFT (which needs to be known for
        // processing refunds later).
        handle_create_deposit(ctx, deposit_amount)
    }

    // Process a DepositRecord account and transfer funds to the escrow account.
    // This is step 2 of the deposit flow.
    pub fn process_deposit(ctx: Context<ProcessDeposit>) -> Result<()> {
        // This processes a created deposit and transfers the deposited funds
        // (swapping if necessary to the treasury currency) to the CampaignEscrow
        // treasury_escrow account.
        handle_process_deposit(ctx)
    }

    // Handles closing a DepositRecord account.
    pub fn close_deposit_record(ctx: Context<CloseDepositRecord>) -> Result<()> {
        handle_close_deposit_record(ctx)
    }

    // Pay out funds from a CampaignEscrow account for a given payout phase.
    pub fn pay_out_funds(ctx: Context<PayOutFunds>) -> Result<()> {
        handle_pay_out_funds(ctx)
    }

    // Process a full refund from a campaign supporter.
    // Requires supporter burning campaign NFT and for the campaign goal
    // to not be met.
    pub fn process_full_refund(ctx: Context<ProcessFullRefund>) -> Result<()> {
        // Refund the full deposit amount. Refund submitter must burn the
        // NFT purchased for the campaign (on their DepositRecord account).
        handle_process_full_refund(ctx)
    }

    // Process a partial refund from a campaign supporter.
    // Happens during a payout phase and does not require burning the campaign NFT.
    pub fn process_partial_refund(ctx: Context<ProcessPartialRefund>) -> Result<()> {
        // Calculate and refund the amount proportional to the remaining
        // funds in the escrow and the original deposit amount.
        handle_process_partial_refund(ctx)
    }

    // Allow the authority account to veto a payout phase.
    pub fn veto_payout_phase(ctx: Context<VetoPayoutPhase>, payout_phase_index: u8) -> Result<()> {
        handle_veto_payout_phase(ctx, payout_phase_index)
    }
}
