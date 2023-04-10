use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{Mint, Token},
};

use crate::{
    assert_campaign_end_time_is_valid, assert_valid_escrow_management_signers,
    constants::PROGRAM_PREFIX, create_treasury_escrow_and_assert_is_valid, is_native_mint,
    CampaignEscrow, NonVotingPayoutPhaseInput, PayoutPhases, Treasury, TreasuryEscrow,
    VotingPayoutPhaseInput,
};

#[derive(Accounts)]
#[instruction(campaign_uuid: String, treasury_bump: u8)]
pub struct CreateEscrow<'info> {
    #[account(
        init,
        seeds = [
            CampaignEscrow::PREFIX.as_bytes(),
            campaign_uuid.as_bytes(),
        ],
        bump,
        payer = payer,
        space = CampaignEscrow::SPACE,
    )]
    campaign_escrow: Account<'info, CampaignEscrow>,
    #[account(mut)]
    payer: Signer<'info>,
    #[account()]
    authority: SystemAccount<'info>,
    #[account()]
    creator: SystemAccount<'info>,
    #[account()]
    treasury_mint: Account<'info, Mint>,
    /// CHECK: Validated in instruction.
    #[account(
        mut,
        seeds = [
            PROGRAM_PREFIX.as_bytes(),
            campaign_uuid.as_bytes(),
            TreasuryEscrow::PREFIX.as_bytes()
        ],
        bump = treasury_bump,
    )]
    treasury_escrow: UncheckedAccount<'info>,
    /// CHECK: Validated in instruction.
    #[account(mut)]
    payout_wallet: UncheckedAccount<'info>,
    #[account()]
    payout_wallet_owner: SystemAccount<'info>,
    token_program: Program<'info, Token>,
    ata_program: Program<'info, AssociatedToken>,
    system_program: Program<'info, System>,
    rent: Sysvar<'info, Rent>,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug)]
pub struct CreateCampaignEscrowInput {
    pub campaign_end_time: i64,
    pub non_voting_payout_phases: Vec<NonVotingPayoutPhaseInput>,
    // TODO[@bonham000]: Should we go ahead and include the voting payout_phases
    // data in the argument now for backwards compatibility reasons?
    // context: https://www.notion.so/formfunction/Solana-Program-Backwards-Compatibility-18a68a79f6374c43be9b44f063998366#4d54d0b2012842d88b5d7214713ae5c4
    pub voting_payout_phases: Vec<VotingPayoutPhaseInput>,
}

pub fn handle_create_escrow(
    ctx: Context<CreateEscrow>,
    campaign_uuid: String,
    treasury_bump: u8,
    create_campaign_escrow_input: CreateCampaignEscrowInput,
) -> Result<()> {
    let campaign_escrow = &mut ctx.accounts.campaign_escrow;
    let payer = &ctx.accounts.payer;
    let authority = &ctx.accounts.authority;
    let creator = &ctx.accounts.creator;
    let treasury_escrow = &ctx.accounts.treasury_escrow;
    let treasury_mint = &ctx.accounts.treasury_mint;
    let payout_wallet = &ctx.accounts.payout_wallet;
    let payout_wallet_owner = &ctx.accounts.payout_wallet_owner;
    let token_program = &ctx.accounts.token_program;
    let ata_program = &ctx.accounts.ata_program;
    let system_program = &ctx.accounts.system_program;
    let rent = &ctx.accounts.rent;

    assert_valid_escrow_management_signers(creator, authority, None)?;

    create_treasury_escrow_and_assert_is_valid(
        campaign_escrow.to_account_info(),
        treasury_escrow.to_account_info(),
        treasury_mint.to_account_info(),
        payout_wallet.to_account_info(),
        payout_wallet_owner.to_account_info(),
        payer.to_account_info(),
        ata_program,
        token_program,
        system_program,
        rent,
        &[],
        treasury_bump,
        campaign_uuid.clone(),
    )?;

    let clock = Clock::get()?;
    assert_campaign_end_time_is_valid(
        clock.unix_timestamp,
        create_campaign_escrow_input.campaign_end_time,
    )?;

    let bump = *ctx.bumps.get(CampaignEscrow::PREFIX).unwrap();

    campaign_escrow.bump = bump;
    campaign_escrow.campaign_uuid = campaign_uuid.clone();
    campaign_escrow.authority = authority.key();
    campaign_escrow.creator = creator.key();
    campaign_escrow.payout_wallet = payout_wallet.key();
    campaign_escrow.treasury = Treasury {
        bump: treasury_bump,
        treasury_mint: treasury_mint.key(),
        treasury_escrow: treasury_escrow.key(),
        total_funds: 0,
    };
    campaign_escrow.campaign_end_time = create_campaign_escrow_input.campaign_end_time;
    campaign_escrow.payouts_ready = false;
    campaign_escrow.deposit_count = 0;
    campaign_escrow.processed_deposit_count = 0;

    let payout_phases = PayoutPhases::new(
        create_campaign_escrow_input.non_voting_payout_phases,
        create_campaign_escrow_input.voting_payout_phases,
        create_campaign_escrow_input.campaign_end_time,
    )?;

    campaign_escrow.payout_phases = payout_phases;

    let is_treasury_native = is_native_mint(&treasury_mint.key());
    let treasury_description = if is_treasury_native {
        "native"
    } else {
        "non-native"
    };

    msg!(
        "Created CampaignEscrow account at address {} for campaign uuid {} with a {} treasury.",
        campaign_escrow.key(),
        campaign_uuid,
        treasury_description,
    );

    Ok(())
}
