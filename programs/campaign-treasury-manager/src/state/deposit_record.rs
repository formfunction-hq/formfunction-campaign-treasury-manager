use anchor_lang::prelude::*;

// This is a PDA of the depositor + NFT mint.
// If this account exists, there is an eligible refund for that buyer + mint.
#[account]
#[derive(Default, Debug)]
pub struct DepositRecord {
    // PDA bump.
    pub bump: u8,
    // The associated NFT mint of this deposit.
    pub mint: Pubkey,
    // The pubkey of the campaign supporter this deposit is coming from.
    pub depositor: Pubkey,
    // The mint of the sale currency and associated deposit escrow account.
    pub deposit_escrow_mint: Pubkey,
    // Records the initial deposit amount, this amount is in the deposit_escrow_mint
    // and will only equal the processed_deposit_amount if the deposit currency
    // matches the treasury currency.
    pub initial_deposit_amount: u64,
    // The processed deposit amount (the amount actually transferred to the
    // campaign escrow treasury escrow account).
    pub processed_deposit_amount: u64,
    // Indicates if the deposit funds have been moved to the treasury escrow.
    // That means this will be false if the deposit funds have only been moved
    // to this deposit escrow account, but not swapped and transferred into
    // the treasury escrow yet.
    pub deposit_processed: bool,
}

impl DepositRecord {
    pub const SPACE: usize = 8 + // account discriminator
        1 + // bump
        32 + // mint
        32 + // depositor
        32 + // sale_currency_mint
        8 + // initial_deposit_amount
        8 + // processed_deposit_amount
        1 + // deposit_processed
        64; // extra padding

    pub const PREFIX: &'static str = "deposit_record";
}
