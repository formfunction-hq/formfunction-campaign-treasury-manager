use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token, TokenAccount};

use crate::{
    close_system_account, close_token_account, cmp_pubkeys, is_native_mint, CampaignEscrow,
    CampaignTreasuryManagerError, DepositEscrow,
};

#[derive(Accounts)]
#[instruction()]
pub struct CloseDepositEscrow<'info> {
    #[account(
        has_one = authority,
        seeds = [
            CampaignEscrow::PREFIX.as_bytes(),
            campaign_escrow.campaign_uuid.as_bytes(),
        ],
        bump = campaign_escrow.bump,
    )]
    campaign_escrow: Account<'info, CampaignEscrow>,
    /// CHECK: Account validated in instruction.
    #[account(
        mut,
        seeds = [
            DepositEscrow::PREFIX.as_bytes(),
            campaign_escrow.campaign_uuid.as_bytes(),
            deposit_escrow_mint.key().as_ref()
        ],
        bump = campaign_escrow.deposit_escrow_infos.iter().find(|val|
            cmp_pubkeys(&val.mint, &deposit_escrow_mint.key())
        ).unwrap().deposit_escrow_bump,
    )]
    deposit_escrow: UncheckedAccount<'info>,
    deposit_escrow_mint: Account<'info, Mint>,
    #[account(mut)]
    receiver: SystemAccount<'info>,
    #[account()]
    authority: Signer<'info>,
    token_program: Program<'info, Token>,
    system_program: Program<'info, System>,
}

pub fn handle_close_deposit_escrow(ctx: Context<CloseDepositEscrow>) -> Result<()> {
    let campaign_escrow = &ctx.accounts.campaign_escrow;
    let deposit_escrow_mint = &ctx.accounts.deposit_escrow_mint;
    let deposit_escrow_mint_pubkey = deposit_escrow_mint.key();

    // Note: DepositEscrow accounts could technically be closed before all payouts
    // are complete, but the other accounts which need to be closed need to wait
    // for all payouts to be complete, and we will probably have all of the account
    // cleanup handled by the same process so this is simpler.
    campaign_escrow.assert_all_payouts_are_complete()?;

    if is_native_mint(&deposit_escrow_mint.key()) {
        let lamports = ctx.accounts.deposit_escrow.to_account_info().lamports();
        if lamports > 0 {
            msg!(
                "DepositEscrow must have zero SOL before it is closed. Found {} lamports.",
                lamports
            );
            return Err(CampaignTreasuryManagerError::DepositEscrowAccountNotEmpty.into());
        }

        let deposit_escrow_bump = campaign_escrow
            .deposit_escrow_infos
            .iter()
            .find(|val| cmp_pubkeys(&val.mint, &deposit_escrow_mint_pubkey))
            .unwrap()
            .deposit_escrow_bump;

        let escrow_signer_seeds = DepositEscrow::get_seeds(
            &campaign_escrow.campaign_uuid,
            &deposit_escrow_mint_pubkey,
            &deposit_escrow_bump,
        );

        close_system_account(
            ctx.accounts.deposit_escrow.to_account_info(),
            ctx.accounts.receiver.to_account_info(),
            ctx.accounts.system_program.to_account_info(),
            &escrow_signer_seeds,
        )?;
    } else {
        let deposit_escrow = &ctx.accounts.deposit_escrow;
        let ref_data = deposit_escrow.try_borrow_data()?;
        let mut account_data: &[u8] = &ref_data;
        let token_account = TokenAccount::try_deserialize(&mut account_data)?;
        let tokens = token_account.amount;
        if tokens > 0 {
            msg!("DepositEscrow token account must have zero tokens before it is closed. Found {} tokens.", tokens);
            return Err(CampaignTreasuryManagerError::DepositEscrowAccountNotEmpty.into());
        }
        // Need to drop the mutable account borrow before trying to close the account below.
        drop(ref_data);

        let campaign_escrow_seeds = [
            CampaignEscrow::PREFIX.as_bytes(),
            campaign_escrow.campaign_uuid.as_bytes(),
            &[campaign_escrow.bump],
        ];

        close_token_account(
            ctx.accounts.deposit_escrow.to_account_info(),
            ctx.accounts.receiver.to_account_info(),
            ctx.accounts.campaign_escrow.to_account_info(),
            ctx.accounts.token_program.to_account_info(),
            &campaign_escrow_seeds,
        )?;
    }

    let campaign_escrow = &mut ctx.accounts.campaign_escrow;
    campaign_escrow.mark_deposit_escrow_as_closed(&deposit_escrow_mint_pubkey);

    msg!(
        "Closed deposit escrow for currency mint {} and sent rent to receiver {}.",
        ctx.accounts.deposit_escrow_mint.key(),
        ctx.accounts.receiver.key()
    );
    Ok(())
}
