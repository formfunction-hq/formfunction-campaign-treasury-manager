use std::convert::TryInto;

use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{self, Token},
};
use solana_program::{
    program::{invoke, invoke_signed},
    program_memory::sol_memcmp,
    program_pack::{IsInitialized, Pack},
    pubkey::{Pubkey, PUBKEY_BYTES},
    system_instruction,
};
use spl_associated_token_account::{
    get_associated_token_address, instruction::create_associated_token_account,
};
use spl_token::instruction::initialize_account2;

use crate::{
    buffer_times::{MaxBufferTimes, MaxBufferTimesTrait, MinBufferTimes, MinBufferTimesTrait},
    CampaignEscrow, CampaignTreasuryManagerError, DepositEscrow, PayoutPhaseEnum, TreasuryEscrow,
};

pub fn cmp_pubkeys(a: &Pubkey, b: &Pubkey) -> bool {
    sol_memcmp(a.as_ref(), b.as_ref(), PUBKEY_BYTES) == 0
}

pub fn is_native_mint(mint: &Pubkey) -> bool {
    mint.key() == spl_token::native_mint::id()
}

pub fn assert_owned_by(account: &AccountInfo, owner: &Pubkey) -> Result<()> {
    if !cmp_pubkeys(account.owner, owner) {
        Err(CampaignTreasuryManagerError::IncorrectOwner.into())
    } else {
        Ok(())
    }
}

pub fn assert_initialized<T: Pack + IsInitialized>(account_info: &AccountInfo) -> Result<T> {
    let account: T = T::unpack_unchecked(&account_info.data.borrow())?;
    if !account.is_initialized() {
        Err(CampaignTreasuryManagerError::UninitializedAccount.into())
    } else {
        Ok(account)
    }
}

pub fn assert_is_ata(
    ata: &AccountInfo,
    wallet: &Pubkey,
    mint: &Pubkey,
) -> Result<spl_token::state::Account> {
    assert_owned_by(ata, &spl_token::id())?;
    let ata_account: spl_token::state::Account = assert_initialized(ata)?;
    assert_keys_equal(&ata_account.owner, wallet, None)?;
    assert_keys_equal(&get_associated_token_address(wallet, mint), ata.key, None)?;
    Ok(ata_account)
}

pub fn assert_keys_equal(
    key1: &Pubkey,
    key2: &Pubkey,
    error_code: Option<CampaignTreasuryManagerError>,
) -> Result<()> {
    if !cmp_pubkeys(key1, key2) {
        msg!("PublicKeyMismatch, expected {} = {}", key1, key2);
        Err(error_code
            .unwrap_or(CampaignTreasuryManagerError::PublicKeyMismatch)
            .into())
    } else {
        Ok(())
    }
}

pub fn assert_valid_escrow_management_signers<'a>(
    creator: &AccountInfo<'a>,
    authority: &AccountInfo<'a>,
    campaign_escrow: Option<&Account<CampaignEscrow>>,
) -> Result<()> {
    if !creator.is_signer && !authority.is_signer {
        return Err(CampaignTreasuryManagerError::MissingSigner.into());
    }

    if let Some(campaign_escrow) = campaign_escrow {
        if !cmp_pubkeys(&authority.key(), &campaign_escrow.authority.key()) {
            return Err(CampaignTreasuryManagerError::AuthorityMismatch.into());
        }

        if !cmp_pubkeys(&creator.key(), &campaign_escrow.creator.key()) {
            return Err(CampaignTreasuryManagerError::CreatorMismatch.into());
        }
    }

    Ok(())
}

pub fn assert_payout_time_and_refund_deadline_are_valid(
    payout_time: i64,
    refund_deadline: i64,
) -> Result<()> {
    if refund_deadline <= payout_time {
        msg!(
            "Index {} PayoutPhase refund_deadline must be after the payout_time.",
            payout_time
        );
        return Err(CampaignTreasuryManagerError::InvalidPayoutPhases.into());
    }

    assert_min_time_buffer(
        payout_time,
        refund_deadline,
        MinBufferTimes::PAYOUT_TIME_TO_REFUND_DEADLINE_IN_SECONDS,
        CampaignTreasuryManagerError::InvalidPayoutPhases,
        format!(
            "Initial PayoutPhase refund_deadline {} failed min buffer time check.",
            payout_time
        ),
    )?;

    assert_max_time_buffer(
        payout_time,
        refund_deadline,
        MaxBufferTimes::PAYOUT_TIME_TO_REFUND_DEADLINE_IN_SECONDS,
        CampaignTreasuryManagerError::InvalidPayoutPhases,
        format!(
            "Initial PayoutPhase refund_deadline {} failed max buffer time check.",
            refund_deadline
        ),
    )?;

    Ok(())
}

pub fn assert_initial_payout_phase_is_valid(
    initial_payout_phase: PayoutPhaseEnum,
    campaign_end_time: i64,
) -> Result<()> {
    let payout_time = PayoutPhaseEnum::get_payout_time(&initial_payout_phase);
    let refund_deadline = PayoutPhaseEnum::get_refund_deadline(&initial_payout_phase);

    if payout_time <= campaign_end_time {
        msg!("Initial PayoutPhase payout_time must be after the campaign_end_time payout_time.",);
        return Err(CampaignTreasuryManagerError::InvalidPayoutPhases.into());
    }

    assert_min_time_buffer(
        campaign_end_time,
        payout_time,
        MinBufferTimes::CAMPAIGN_END_TIME_TO_INITIAL_PAYOUT_IN_SECONDS,
        CampaignTreasuryManagerError::InvalidPayoutPhases,
        format!(
            "Initial PayoutPhase payout_time {} failed min buffer time check against campaign_end_time.",
            payout_time
        ),
    )?;

    assert_max_time_buffer(
        campaign_end_time,
        payout_time,
        MaxBufferTimes::CAMPAIGN_END_TIME_TO_INITIAL_PAYOUT_IN_SECONDS,
        CampaignTreasuryManagerError::InvalidPayoutPhases,
        format!(
            "Initial PayoutPhase payout_time {} failed max buffer time check against campaign_end_time.",
            payout_time
        ),
    )?;

    assert_payout_time_and_refund_deadline_are_valid(payout_time, refund_deadline)?;

    Ok(())
}

pub fn assert_payout_phase_is_valid(
    index: usize,
    payout_phase: PayoutPhaseEnum,
    previous_payout_phase: Option<PayoutPhaseEnum>,
    campaign_end_time: i64,
) -> Result<()> {
    if index == 0 {
        return assert_initial_payout_phase_is_valid(payout_phase.clone(), campaign_end_time);
    }

    let previous_payout_time = PayoutPhaseEnum::get_payout_time(&previous_payout_phase.unwrap());
    let payout_time = PayoutPhaseEnum::get_payout_time(&payout_phase);
    let refund_deadline = PayoutPhaseEnum::get_refund_deadline(&payout_phase);

    if payout_time <= previous_payout_time {
        msg!(
            "Index {} PayoutPhase payout_time must be after the previous payout phase payout_time.",
            index
        );
        return Err(CampaignTreasuryManagerError::InvalidPayoutPhases.into());
    }

    assert_min_time_buffer(
        previous_payout_time,
        payout_time,
        MinBufferTimes::PAYOUT_TIME_TO_NEXT_PAYOUT_TIME_IN_SECONDS,
        CampaignTreasuryManagerError::InvalidPayoutPhases,
        format!(
            "PayoutPhase index {} failed min buffer time check against previous_payout_time.",
            index,
        ),
    )?;

    assert_max_time_buffer(
        previous_payout_time,
        payout_time,
        MaxBufferTimes::PAYOUT_TIME_TO_NEXT_PAYOUT_TIME_IN_SECONDS,
        CampaignTreasuryManagerError::InvalidPayoutPhases,
        format!(
            "PayoutPhase index {} failed max buffer time check against previous_payout_time.",
            index
        ),
    )?;

    assert_payout_time_and_refund_deadline_are_valid(payout_time, refund_deadline)?;

    Ok(())
}

pub fn assert_campaign_end_time_is_valid(now: i64, campaign_end_time: i64) -> Result<()> {
    assert_min_time_buffer(
        now,
        campaign_end_time,
        MinBufferTimes::NOW_TO_CAMPAIGN_END_TIME_IN_SECONDS,
        CampaignTreasuryManagerError::InvalidCampaignEndTime,
        String::from("Minimum time between now and the campaign_end_time is invalid."),
    )?;

    assert_max_time_buffer(
        now,
        campaign_end_time,
        MaxBufferTimes::NOW_TO_CAMPAIGN_END_TIME_IN_SECONDS,
        CampaignTreasuryManagerError::InvalidCampaignEndTime,
        String::from("Maximum time between now and the campaign_end_time is invalid."),
    )?;

    Ok(())
}

pub fn assert_min_time_buffer(
    time_start: i64,
    time_end: i64,
    min_time_buffer: i64,
    error_code: CampaignTreasuryManagerError,
    error_description: String,
) -> Result<()> {
    let min_future_time = time_start.checked_add(min_time_buffer).unwrap();

    if time_end < min_future_time {
        let diff = min_future_time.checked_sub(time_end).unwrap();
        msg!("{}", error_description);
        msg!(
            "Expected difference between time_start of {} and time_end of {} to be at least {} but got {}.",
            time_start,
            time_end,
            min_time_buffer,
            diff,
        );
        return Err(error_code.into());
    }

    Ok(())
}

pub fn assert_max_time_buffer(
    time_start: i64,
    time_end: i64,
    max_time_buffer: i64,
    error_code: CampaignTreasuryManagerError,
    error_description: String,
) -> Result<()> {
    let max_future_time = time_start.checked_add(max_time_buffer).unwrap();

    if time_end > max_future_time {
        let diff = time_end.checked_sub(max_future_time).unwrap();
        msg!("{}", error_description);
        msg!(
            "Expected difference between time_start of {} and time_end of {} to be no more than {} but got {}.",
            time_start,
            time_end,
            max_time_buffer,
            diff,
        );
        return Err(error_code.into());
    }

    Ok(())
}

pub fn create_treasury_escrow_and_assert_is_valid<'a>(
    campaign_escrow: AccountInfo<'a>,
    treasury_escrow: AccountInfo<'a>,
    treasury_mint: AccountInfo<'a>,
    payout_wallet: AccountInfo<'a>,
    payout_wallet_owner: AccountInfo<'a>,
    payer: AccountInfo<'a>,
    ata_program: &Program<'a, AssociatedToken>,
    token_program: &Program<'a, Token>,
    system_program: &Program<'a, System>,
    rent: &Sysvar<'a, Rent>,
    fee_payer_seeds: &[&[u8]],
    treasury_bump: u8,
    campaign_uuid: String,
) -> Result<()> {
    if is_native_mint(&treasury_mint.key()) {
        assert_keys_equal(
            &payout_wallet.key(),
            &payout_wallet_owner.key(),
            Some(CampaignTreasuryManagerError::InvalidTreasuryEscrow),
        )?;
        return Ok(());
    }

    let treasury_seeds = TreasuryEscrow::get_seeds(&campaign_uuid, &treasury_bump);

    create_program_token_account_if_not_present(
        treasury_escrow,
        system_program,
        &payer,
        token_program,
        &treasury_mint.to_account_info(),
        &campaign_escrow.to_account_info(),
        rent,
        &treasury_seeds,
        fee_payer_seeds,
    )?;

    if payout_wallet.data_is_empty() {
        make_ata(
            payout_wallet.to_account_info(),
            payout_wallet_owner.to_account_info(),
            treasury_mint.to_account_info(),
            payer.to_account_info(),
            ata_program.to_account_info(),
            token_program.to_account_info(),
            system_program.to_account_info(),
            rent.to_account_info(),
            fee_payer_seeds,
        )?;
    }

    if let Err(e) = assert_is_ata(
        &payout_wallet.to_account_info(),
        &payout_wallet_owner.key(),
        &treasury_mint.key(),
    ) {
        msg!("assert_is_ata error creating treasury_escrow: {}", e);
        return Err(CampaignTreasuryManagerError::InvalidTreasuryEscrow.into());
    };

    Ok(())
}

pub fn create_deposit_escrow_account<'a>(
    campaign_escrow: AccountInfo<'a>,
    deposit_escrow_account: AccountInfo<'a>,
    deposit_escrow_mint: AccountInfo<'a>,
    payer: AccountInfo<'a>,
    token_program: &Program<'a, Token>,
    system_program: &Program<'a, System>,
    rent: &Sysvar<'a, Rent>,
    fee_payer_seeds: &[&[u8]],
    deposit_escrow_bump: u8,
    campaign_uuid: String,
) -> Result<()> {
    if is_native_mint(&deposit_escrow_mint.key()) {
        return Ok(());
    }

    let deposit_escrow_mint_pubkey = deposit_escrow_mint.key();
    let deposit_escrow_seeds = DepositEscrow::get_seeds(
        &campaign_uuid,
        &deposit_escrow_mint_pubkey,
        &deposit_escrow_bump,
    );

    create_program_token_account_if_not_present(
        deposit_escrow_account,
        system_program,
        &payer,
        token_program,
        &deposit_escrow_mint.to_account_info(),
        &campaign_escrow.to_account_info(),
        rent,
        &deposit_escrow_seeds,
        fee_payer_seeds,
    )?;

    Ok(())
}

pub fn create_program_token_account_if_not_present<'a>(
    new_account: AccountInfo<'a>,
    system_program: &Program<'a, System>,
    fee_payer: &AccountInfo<'a>,
    token_program: &Program<'a, Token>,
    token_mint: &AccountInfo<'a>,
    owner: &AccountInfo<'a>,
    rent: &Sysvar<'a, Rent>,
    signer_seeds: &[&[u8]],
    fee_seeds: &[&[u8]],
) -> Result<()> {
    if is_native_mint(&token_mint.key()) {
        return Ok(());
    }

    if new_account.data_is_empty() {
        create_or_allocate_account_raw(
            *token_program.key,
            &new_account.to_account_info(),
            &rent.to_account_info(),
            system_program,
            fee_payer,
            spl_token::state::Account::LEN,
            fee_seeds,
            signer_seeds,
        )?;
        invoke_signed(
            &initialize_account2(
                token_program.key,
                &new_account.key(),
                &token_mint.key(),
                &owner.key(),
            )
            .unwrap(),
            &[
                token_program.to_account_info(),
                token_mint.clone(),
                new_account.to_account_info(),
                rent.to_account_info(),
                owner.clone(),
            ],
            &[signer_seeds],
        )?;
    }

    Ok(())
}

/// Create account almost from scratch, lifted from
/// https://github.com/solana-labs/solana-program-library/blob/7d4873c61721aca25464d42cc5ef651a7923ca79/associated-token-account/program/src/processor.rs#L51-L98
#[inline(always)]
pub fn create_or_allocate_account_raw<'a>(
    program_id: Pubkey,
    new_account_info: &AccountInfo<'a>,
    rent_sysvar_info: &AccountInfo<'a>,
    system_program_info: &AccountInfo<'a>,
    payer_info: &AccountInfo<'a>,
    size: usize,
    signer_seeds: &[&[u8]],
    new_acct_seeds: &[&[u8]],
) -> Result<()> {
    let rent = &Rent::from_account_info(rent_sysvar_info)?;
    let required_lamports = rent
        .minimum_balance(size)
        .max(1)
        .saturating_sub(new_account_info.lamports());

    if required_lamports > 0 {
        msg!("Transfer {} lamports to the new account", required_lamports);
        let as_arr = [signer_seeds];
        let seeds: &[&[&[u8]]] = if signer_seeds.is_empty() {
            &[]
        } else {
            &as_arr
        };

        invoke_signed(
            &system_instruction::transfer(payer_info.key, new_account_info.key, required_lamports),
            &[
                payer_info.clone(),
                new_account_info.clone(),
                system_program_info.clone(),
            ],
            seeds,
        )?;
    }

    let accounts = &[new_account_info.clone(), system_program_info.clone()];

    msg!("Allocate space for the account {}", new_account_info.key);
    invoke_signed(
        &system_instruction::allocate(new_account_info.key, size.try_into().unwrap()),
        accounts,
        &[new_acct_seeds],
    )?;

    msg!("Assign the account to the owning program");
    invoke_signed(
        &system_instruction::assign(new_account_info.key, &program_id),
        accounts,
        &[new_acct_seeds],
    )?;
    msg!("Completed assignation!");

    Ok(())
}

pub fn transfer_funds<'a>(
    source_account: AccountInfo<'a>,
    destination_account: AccountInfo<'a>,
    payment_account: AccountInfo<'a>,
    token_mint: AccountInfo<'a>,
    token_program: &Program<'a, Token>,
    system_program: &Program<'a, System>,
    amount: u64,
) -> Result<()> {
    if is_native_mint(&token_mint.key()) {
        assert_keys_equal(&source_account.key(), &payment_account.key(), None)?;
        invoke(
            &system_instruction::transfer(source_account.key, destination_account.key, amount),
            &[
                source_account.to_account_info(),
                destination_account.to_account_info(),
                system_program.to_account_info(),
            ],
        )?;
    } else {
        assert_is_ata(&payment_account, &source_account.key(), &token_mint.key())?;
        invoke(
            &spl_token::instruction::transfer(
                token_program.key,
                &payment_account.key(),
                &destination_account.key(),
                &source_account.key(),
                &[],
                amount,
            )?,
            &[
                source_account.to_account_info(),
                payment_account.to_account_info(),
                destination_account.to_account_info(),
                token_program.to_account_info(),
            ],
        )?;
    }

    Ok(())
}

pub fn make_ata<'a>(
    ata: AccountInfo<'a>,
    wallet: AccountInfo<'a>,
    mint: AccountInfo<'a>,
    fee_payer: AccountInfo<'a>,
    ata_program: AccountInfo<'a>,
    token_program: AccountInfo<'a>,
    system_program: AccountInfo<'a>,
    rent: AccountInfo<'a>,
    fee_payer_seeds: &[&[u8]],
) -> Result<()> {
    let as_arr = [fee_payer_seeds];
    let seeds: &[&[&[u8]]] = if fee_payer_seeds.is_empty() {
        &[]
    } else {
        &as_arr
    };

    invoke_signed(
        &create_associated_token_account(fee_payer.key, wallet.key, mint.key, token_program.key),
        &[
            ata,
            wallet,
            mint,
            fee_payer,
            ata_program,
            system_program,
            rent,
            token_program,
        ],
        seeds,
    )?;

    Ok(())
}

pub fn close_system_account<'a>(
    account: AccountInfo<'a>,
    receiver: AccountInfo<'a>,
    system_program: AccountInfo<'a>,
    signers_seeds: &[&[u8]],
) -> Result<()> {
    invoke_signed(
        &system_instruction::transfer(&account.key(), &receiver.key(), account.lamports()),
        &[
            account.to_account_info(),
            receiver.to_account_info(),
            system_program.to_account_info(),
        ],
        &[signers_seeds],
    )?;

    Ok(())
}

pub fn close_token_account<'a>(
    account: AccountInfo<'a>,
    receiver: AccountInfo<'a>,
    authority: AccountInfo<'a>,
    token_program: AccountInfo<'a>,
    signers_seeds: &[&[u8]],
) -> Result<()> {
    token::close_account(
        CpiContext::new(
            token_program.to_account_info(),
            token::CloseAccount {
                account: account.to_account_info(),
                destination: receiver.to_account_info(),
                authority: authority.to_account_info(),
            },
        )
        .with_signer(&[signers_seeds]),
    )?;

    Ok(())
}
