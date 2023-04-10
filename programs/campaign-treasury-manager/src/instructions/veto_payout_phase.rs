use anchor_lang::prelude::*;

use crate::CampaignEscrow;

#[derive(Accounts)]
#[instruction()]
pub struct VetoPayoutPhase<'info> {
    #[account(
        mut,
        has_one = authority,
        seeds = [
            CampaignEscrow::PREFIX.as_bytes(),
            campaign_escrow.campaign_uuid.as_bytes(),
        ],
        bump = campaign_escrow.bump,
    )]
    campaign_escrow: Account<'info, CampaignEscrow>,
    #[account(mut)]
    payer: Signer<'info>,
    #[account()]
    authority: Signer<'info>,
}

pub fn handle_veto_payout_phase(
    ctx: Context<VetoPayoutPhase>,
    payout_phase_index: u8,
) -> Result<()> {
    let campaign_escrow = &mut ctx.accounts.campaign_escrow;

    // TODO[@bonham000]: We probably want to verify that payouts have not
    // already begun for this payout phase?

    campaign_escrow
        .payout_phases
        .veto_payout_phase_by_authority(payout_phase_index);

    msg!(
        "Authority {} vetoed payout phase with index {}.",
        ctx.accounts.authority.key(),
        payout_phase_index
    );

    Ok(())
}
