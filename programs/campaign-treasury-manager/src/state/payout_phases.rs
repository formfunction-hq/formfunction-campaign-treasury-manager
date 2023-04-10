use anchor_lang::prelude::*;

use crate::{
    assert_payout_phase_is_valid, constants::ONE_HUNDRED_PERCENT_BASIS_POINTS,
    CampaignTreasuryManagerError,
};

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug)]
pub struct PayoutPhases {
    non_voting_payout_phases: Vec<NonVotingPayoutPhase>,
    voting_payout_phases: Vec<VotingPayoutPhase>,
}

impl PayoutPhases {
    pub const NON_VOTING_PAYOUT_PHASE_LEN_LIMIT: usize = 1;
    pub const VOTING_PAYOUT_PHASE_LEN_LIMIT: usize = 3;

    pub const SPACE: usize = 4 + // 4 bytes of overhead for vec storage
        PayoutPhases::NON_VOTING_PAYOUT_PHASE_LEN_LIMIT * NonVotingPayoutPhase::SPACE + // non_voting_payout_phases
        4 + // 4 bytes of overhead for vec storage
        PayoutPhases::VOTING_PAYOUT_PHASE_LEN_LIMIT * VotingPayoutPhase::SPACE; // voting_payout_phases
}

impl PayoutPhases {
    fn default() -> Self {
        PayoutPhases {
            non_voting_payout_phases: vec![],
            voting_payout_phases: vec![],
        }
    }

    pub fn new(
        non_voting_payout_phases_input: Vec<NonVotingPayoutPhaseInput>,
        voting_payout_phases_input: Vec<VotingPayoutPhaseInput>,
        campaign_end_time: i64,
    ) -> Result<Self> {
        let mut payout_phases = PayoutPhases::default();

        for payout_phase_input in non_voting_payout_phases_input.iter() {
            payout_phases
                .non_voting_payout_phases
                .push(NonVotingPayoutPhase {
                    shared_fields: payout_phase_input.shared_fields.clone(),
                    is_paid_out: false,
                    is_vetoed_by_authority: false,
                });
        }

        for payout_phase_input in voting_payout_phases_input.iter() {
            payout_phases.voting_payout_phases.push(VotingPayoutPhase {
                shared_fields: payout_phase_input.shared_fields.clone(),
                is_paid_out: false,
                is_vetoed_by_authority: false,
                voting_start_time: payout_phase_input.voting_start_time,
                vote_basis_points_veto_threshold: payout_phase_input
                    .vote_basis_points_veto_threshold,
                veto_votes: payout_phase_input.veto_votes,
            });
        }

        payout_phases.assert_is_valid(campaign_end_time)?;

        Ok(payout_phases)
    }

    pub fn assert_is_valid(&self, campaign_end_time: i64) -> Result<()> {
        if self.is_empty() {
            return Ok(());
        }

        let ordered_list = self.to_ordered_list();
        let length = ordered_list.len();
        let expected_length = self.len();
        if length != expected_length {
            msg!(
                "Payout phases ordered list length {} did not match the expected length {}.",
                length,
                expected_length
            );
            return Err(CampaignTreasuryManagerError::InvalidPayoutPhases.into());
        }

        let total_basis_points: u16 = ordered_list.iter().fold(0, |total, item| {
            total + PayoutPhaseEnum::get_payout_basis_points(item)
        });

        if total_basis_points != ONE_HUNDRED_PERCENT_BASIS_POINTS {
            msg!(
                "Total payout phase basis points of {} must equal 100.",
                total_basis_points
            );
            return Err(CampaignTreasuryManagerError::InvalidPayoutPhases.into());
        }

        let mut previous_payout_phase: Option<PayoutPhaseEnum> = None;
        for (index, payout_phase) in ordered_list.into_iter().enumerate() {
            assert_payout_phase_is_valid(
                index,
                payout_phase.clone(),
                previous_payout_phase,
                campaign_end_time,
            )?;
            previous_payout_phase = Some(payout_phase);
        }

        Ok(())
    }

    pub fn len(&self) -> usize {
        self.non_voting_payout_phases.len() + self.voting_payout_phases.len()
    }

    pub fn is_empty(&self) -> bool {
        self.len() == 0
    }

    pub fn get_current_active_payout_phase_for_payout(&self) -> Option<PayoutPhaseEnum> {
        for payout_phases in self.to_ordered_list() {
            match payout_phases {
                PayoutPhaseEnum::Voting(val) => {
                    if !val.is_paid_out {
                        let result = PayoutPhaseEnum::Voting(val);
                        return Some(result);
                    }
                }
                PayoutPhaseEnum::NonVoting(val) => {
                    if !val.is_paid_out {
                        return Some(PayoutPhaseEnum::NonVoting(val));
                    }
                }
            }
        }

        None
    }

    pub fn mark_current_active_payout_phase_as_disbursed(&mut self) {
        let next_payout_phase = self.get_current_active_payout_phase_for_payout();
        if let Some(val) = next_payout_phase {
            let payout_phase_index = PayoutPhaseEnum::get_index(&val);

            for val in self.non_voting_payout_phases.iter_mut() {
                if val.shared_fields.index == payout_phase_index {
                    val.is_paid_out = true;
                    return;
                }
            }

            for val in self.voting_payout_phases.iter_mut() {
                if val.shared_fields.index == payout_phase_index {
                    val.is_paid_out = true;
                    return;
                }
            }
        }
    }

    pub fn veto_payout_phase_by_authority(&mut self, payout_phase_index: u8) {
        let payout_phases = self.to_ordered_list();
        let payout_phase = payout_phases.get(payout_phase_index as usize);
        if let Some(val) = payout_phase {
            let payout_phase_index = PayoutPhaseEnum::get_index(val);

            for val in self.non_voting_payout_phases.iter_mut() {
                if val.shared_fields.index == payout_phase_index {
                    val.is_vetoed_by_authority = true;
                    return;
                }
            }

            for val in self.voting_payout_phases.iter_mut() {
                if val.shared_fields.index == payout_phase_index {
                    val.is_vetoed_by_authority = true;
                    return;
                }
            }
        }
    }

    pub fn to_ordered_list(&self) -> Vec<PayoutPhaseEnum> {
        let mut current_index: usize = 0;

        let mut ordered_list: Vec<PayoutPhaseEnum> = Vec::with_capacity(self.len());
        while current_index < self.len() {
            let next_item = self.get_next_in_order(current_index);
            match next_item {
                Some(item) => ordered_list.push(item),
                None => break,
            }

            current_index += 1;
        }

        ordered_list
    }

    fn get_next_in_order(&self, current_index: usize) -> Option<PayoutPhaseEnum> {
        for i in 0..self.voting_payout_phases.len() {
            let payout_phase = &self.voting_payout_phases[i];
            if current_index == payout_phase.shared_fields.index as usize {
                return Some(PayoutPhaseEnum::Voting(payout_phase));
            }
        }

        for i in 0..self.non_voting_payout_phases.len() {
            let payout_phase = &self.non_voting_payout_phases[i];
            if current_index == payout_phase.shared_fields.index as usize {
                return Some(PayoutPhaseEnum::NonVoting(payout_phase));
            }
        }

        None
    }
}

#[derive(Clone, Debug)]
pub enum PayoutPhaseEnum<'a> {
    Voting(&'a VotingPayoutPhase),
    NonVoting(&'a NonVotingPayoutPhase),
}

impl PayoutPhaseEnum<'_> {
    pub fn get_index(&self) -> u8 {
        match self {
            PayoutPhaseEnum::Voting(val) => val.shared_fields.index,
            PayoutPhaseEnum::NonVoting(val) => val.shared_fields.index,
        }
    }

    pub fn get_payout_basis_points(&self) -> u16 {
        match self {
            PayoutPhaseEnum::Voting(val) => val.shared_fields.payout_basis_points,
            PayoutPhaseEnum::NonVoting(val) => val.shared_fields.payout_basis_points,
        }
    }

    pub fn get_payout_time(&self) -> i64 {
        match self {
            PayoutPhaseEnum::Voting(val) => val.shared_fields.payout_time,
            PayoutPhaseEnum::NonVoting(val) => val.shared_fields.payout_time,
        }
    }

    pub fn get_refund_deadline(&self) -> i64 {
        match self {
            PayoutPhaseEnum::Voting(val) => val.shared_fields.refund_deadline,
            PayoutPhaseEnum::NonVoting(val) => val.shared_fields.refund_deadline,
        }
    }

    pub fn get_description(&self) -> &String {
        match self {
            PayoutPhaseEnum::Voting(val) => &val.shared_fields.description,
            PayoutPhaseEnum::NonVoting(val) => &val.shared_fields.description,
        }
    }

    pub fn get_is_paid_out(&self) -> bool {
        match self {
            PayoutPhaseEnum::Voting(val) => val.is_paid_out,
            PayoutPhaseEnum::NonVoting(val) => val.is_paid_out,
        }
    }

    pub fn get_is_vetoed_by_authority(&self) -> bool {
        match self {
            PayoutPhaseEnum::Voting(val) => val.is_vetoed_by_authority,
            PayoutPhaseEnum::NonVoting(val) => val.is_vetoed_by_authority,
        }
    }
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug)]
pub struct SharedPayoutPhaseFields {
    // Marks the order of this payout phase in the list of payout phases.
    pub index: u8,
    // Basis points to pay out to payout_wallet.
    pub payout_basis_points: u16,
    // Time when payout can be disbursed. This is also when refunds can begin.
    pub payout_time: i64,
    // Deadline for initial refunds if campaign does not meet its goal.
    // After this time, any remaining funds can be withdrawn by the creator.
    pub refund_deadline: i64,
    // Description. May be an off-chain uri.
    pub description: String,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug)]
pub struct NonVotingPayoutPhase {
    pub shared_fields: SharedPayoutPhaseFields,
    // Marks if initial payout has occurred or not.
    pub is_paid_out: bool,
    // Marks if the authority vetoed the initial payout.
    pub is_vetoed_by_authority: bool,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug)]
pub struct NonVotingPayoutPhaseInput {
    pub shared_fields: SharedPayoutPhaseFields,
}

impl NonVotingPayoutPhase {
    // Arbitrary limit in bytes for description length.
    const MAX_DESCRIPTION_LENGTH: usize = 200;

    #[allow(dead_code)]
    const SPACE: usize = 1 + // index
        1 + // is_paid_out
        1 + // is_vetoed_by_authority
        2 + // payout_basis_points
        8 + // payout_time
        8 + // refund_deadline
        4 + // string size allocation
        NonVotingPayoutPhase::MAX_DESCRIPTION_LENGTH + // max description length
        96; // extra padding
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug)]
pub struct VotingPayoutPhase {
    // These fields are the same as the NonVotingPayoutPhase:
    pub shared_fields: SharedPayoutPhaseFields,
    pub is_paid_out: bool,
    pub is_vetoed_by_authority: bool,

    // Time when veto votes can be submitted for this payout phase.
    pub voting_start_time: i64,
    pub veto_votes: u64,
    // Percentage of veto votes required to veto this payout phase.
    // Total votes can be determined by the total deposit amount, assuming
    // votes are distributed based on deposit contribution.
    pub vote_basis_points_veto_threshold: u64,
    // Deadline for initial refunds if campaign does not meet its goal.
    // After this time, any remaining funds can be withdrawn by the creator.
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug)]
pub struct VotingPayoutPhaseInput {
    pub shared_fields: SharedPayoutPhaseFields,
    pub voting_start_time: i64,
    pub veto_votes: u64,
    pub vote_basis_points_veto_threshold: u64,
}

impl VotingPayoutPhase {
    // Arbitrary limit in bytes for description length.
    const MAX_DESCRIPTION_LENGTH: usize = 200;

    const SPACE: usize = 1 + // index
        1 + // is_paid_out
        1 + // is_vetoed_by_authority
        2 + // payout_basis_points
        8 + // payout_time
        8 + // refund_deadline
        4 + // string size allocation
        VotingPayoutPhase::MAX_DESCRIPTION_LENGTH + // max description length
        96 + // extra padding
        8 + // voting_start_time
        8 + // veto_votes
        8; // vote_basis_points_veto_threshold
}

#[cfg(test)]
mod tests {
    use super::*;

    fn get_days_ahead_unix_time(days: i64) -> i64 {
        days * 24 * 60 * 60
    }

    fn percent_to_basis_points(percent: u16) -> u16 {
        percent.checked_mul(100).unwrap()
    }

    fn get_default_non_voting_payout_phase(
        shared_fields: SharedPayoutPhaseFields,
    ) -> NonVotingPayoutPhase {
        NonVotingPayoutPhase {
            shared_fields,
            is_paid_out: false,
            is_vetoed_by_authority: false,
        }
    }

    fn get_default_voting_payout_phase(
        shared_fields: SharedPayoutPhaseFields,
    ) -> VotingPayoutPhase {
        VotingPayoutPhase {
            shared_fields,
            is_paid_out: false,
            is_vetoed_by_authority: false,
            veto_votes: 0,
            vote_basis_points_veto_threshold: 80,
            voting_start_time: 0,
        }
    }

    fn get_valid_payout_phases_for_test() -> PayoutPhases {
        let payout_phases = PayoutPhases {
            non_voting_payout_phases: vec![get_default_non_voting_payout_phase(
                SharedPayoutPhaseFields {
                    index: 0,
                    payout_basis_points: percent_to_basis_points(50),
                    payout_time: get_days_ahead_unix_time(10),
                    refund_deadline: get_days_ahead_unix_time(41),
                    description: String::from("Non-voting payout phase."),
                },
            )],
            voting_payout_phases: vec![
                get_default_voting_payout_phase(SharedPayoutPhaseFields {
                    index: 1,
                    payout_basis_points: percent_to_basis_points(20),
                    payout_time: get_days_ahead_unix_time(100),
                    refund_deadline: get_days_ahead_unix_time(131),
                    description: String::from("Voting payout phase."),
                }),
                get_default_voting_payout_phase(SharedPayoutPhaseFields {
                    index: 2,
                    payout_basis_points: percent_to_basis_points(20),
                    payout_time: get_days_ahead_unix_time(200),
                    refund_deadline: get_days_ahead_unix_time(231),
                    description: String::from("Voting payout phase."),
                }),
                get_default_voting_payout_phase(SharedPayoutPhaseFields {
                    index: 3,
                    payout_basis_points: percent_to_basis_points(5),
                    payout_time: get_days_ahead_unix_time(300),
                    refund_deadline: get_days_ahead_unix_time(331),
                    description: String::from("Voting payout phase."),
                }),
                get_default_voting_payout_phase(SharedPayoutPhaseFields {
                    index: 4,
                    payout_basis_points: percent_to_basis_points(5),
                    payout_time: get_days_ahead_unix_time(400),
                    refund_deadline: get_days_ahead_unix_time(431),
                    description: String::from("Voting payout phase."),
                }),
            ],
        };

        payout_phases
    }

    struct InvalidPayoutPhaseTestCase {
        label: &'static str,
        payout_phases: PayoutPhases,
    }

    fn get_invalid_payout_phases_for_test() -> Vec<InvalidPayoutPhaseTestCase> {
        vec![
            InvalidPayoutPhaseTestCase {
                label: "Invalid payout phase indexes.",
                payout_phases: PayoutPhases {
                    non_voting_payout_phases: vec![get_default_non_voting_payout_phase(
                        SharedPayoutPhaseFields {
                            index: 0,
                            payout_basis_points: percent_to_basis_points(50),
                            payout_time: get_days_ahead_unix_time(0),
                            refund_deadline: get_days_ahead_unix_time(10),
                            description: String::from("Non-voting payout phase."),
                        },
                    )],
                    voting_payout_phases: vec![get_default_voting_payout_phase(
                        SharedPayoutPhaseFields {
                            index: 0,
                            payout_basis_points: percent_to_basis_points(50),
                            payout_time: get_days_ahead_unix_time(12),
                            refund_deadline: get_days_ahead_unix_time(50),
                            description: String::from("Voting payout phase."),
                        },
                    )],
                },
            },
            InvalidPayoutPhaseTestCase {
                label: "Invalid total basis points.",
                payout_phases: PayoutPhases {
                    non_voting_payout_phases: vec![get_default_non_voting_payout_phase(
                        SharedPayoutPhaseFields {
                            index: 0,
                            payout_basis_points: percent_to_basis_points(50),
                            payout_time: get_days_ahead_unix_time(0),
                            refund_deadline: get_days_ahead_unix_time(10),
                            description: String::from("Non-voting payout phase."),
                        },
                    )],
                    voting_payout_phases: vec![get_default_voting_payout_phase(
                        SharedPayoutPhaseFields {
                            index: 1,
                            payout_basis_points: percent_to_basis_points(30),
                            payout_time: get_days_ahead_unix_time(10),
                            refund_deadline: get_days_ahead_unix_time(50),
                            description: String::from("Voting payout phase."),
                        },
                    )],
                },
            },
            InvalidPayoutPhaseTestCase {
                label: "Invalid payout_time for index 1 payout phase.",
                payout_phases: PayoutPhases {
                    non_voting_payout_phases: vec![get_default_non_voting_payout_phase(
                        SharedPayoutPhaseFields {
                            index: 0,
                            payout_basis_points: percent_to_basis_points(50),
                            payout_time: get_days_ahead_unix_time(10),
                            refund_deadline: get_days_ahead_unix_time(20),
                            description: String::from("Non-voting payout phase."),
                        },
                    )],
                    voting_payout_phases: vec![get_default_voting_payout_phase(
                        SharedPayoutPhaseFields {
                            index: 1,
                            payout_basis_points: percent_to_basis_points(50),
                            payout_time: get_days_ahead_unix_time(5),
                            refund_deadline: get_days_ahead_unix_time(50),
                            description: String::from("Voting payout phase."),
                        },
                    )],
                },
            },
            InvalidPayoutPhaseTestCase {
                label: "Invalid refund_deadline for index 1 payout phase.",
                payout_phases: PayoutPhases {
                    non_voting_payout_phases: vec![get_default_non_voting_payout_phase(
                        SharedPayoutPhaseFields {
                            index: 0,
                            payout_basis_points: percent_to_basis_points(50),
                            payout_time: get_days_ahead_unix_time(10),
                            refund_deadline: get_days_ahead_unix_time(20),
                            description: String::from("Non-voting payout phase."),
                        },
                    )],
                    voting_payout_phases: vec![get_default_voting_payout_phase(
                        SharedPayoutPhaseFields {
                            index: 1,
                            payout_basis_points: percent_to_basis_points(50),
                            payout_time: get_days_ahead_unix_time(25),
                            refund_deadline: get_days_ahead_unix_time(20),
                            description: String::from("Voting payout phase."),
                        },
                    )],
                },
            },
            InvalidPayoutPhaseTestCase {
                label: "Invalid refund_deadline (exceeds maximum buffer time).",
                payout_phases: PayoutPhases {
                    non_voting_payout_phases: vec![get_default_non_voting_payout_phase(
                        SharedPayoutPhaseFields {
                            index: 0,
                            payout_basis_points: percent_to_basis_points(100),
                            payout_time: get_days_ahead_unix_time(20),
                            refund_deadline: get_days_ahead_unix_time(210),
                            description: String::from("Non-voting payout phase."),
                        },
                    )],
                    voting_payout_phases: vec![],
                },
            },
            InvalidPayoutPhaseTestCase {
                label:
                    "Invalid payout time for index 1 payout phase (exceeds maximum buffer time).",
                payout_phases: PayoutPhases {
                    non_voting_payout_phases: vec![get_default_non_voting_payout_phase(
                        SharedPayoutPhaseFields {
                            index: 0,
                            payout_basis_points: percent_to_basis_points(50),
                            payout_time: get_days_ahead_unix_time(20),
                            refund_deadline: get_days_ahead_unix_time(20),
                            description: String::from("Non-voting payout phase."),
                        },
                    )],
                    voting_payout_phases: vec![get_default_voting_payout_phase(
                        SharedPayoutPhaseFields {
                            index: 1,
                            payout_basis_points: percent_to_basis_points(50),
                            payout_time: get_days_ahead_unix_time(225),
                            refund_deadline: get_days_ahead_unix_time(100),
                            description: String::from("Voting payout phase."),
                        },
                    )],
                },
            },
            InvalidPayoutPhaseTestCase {
                label: "Invalid refund_deadline for index 0 payout phase (exceeds maximum buffer time).",
                payout_phases: PayoutPhases {
                    non_voting_payout_phases: vec![get_default_non_voting_payout_phase(
                        SharedPayoutPhaseFields {
                            index: 0,
                            payout_basis_points: percent_to_basis_points(50),
                            payout_time: get_days_ahead_unix_time(20),
                            refund_deadline: get_days_ahead_unix_time(22),
                            description: String::from("Non-voting payout phase."),
                        },
                    )],
                    voting_payout_phases: vec![],
                },
            },
            InvalidPayoutPhaseTestCase {
                label: "Invalid refund_deadline for index 1 payout phase (exceeds maximum buffer time).",
                payout_phases: PayoutPhases {
                    non_voting_payout_phases: vec![get_default_non_voting_payout_phase(
                        SharedPayoutPhaseFields {
                            index: 0,
                            payout_basis_points: percent_to_basis_points(50),
                            payout_time: get_days_ahead_unix_time(20),
                            refund_deadline: get_days_ahead_unix_time(40),
                            description: String::from("Non-voting payout phase."),
                        },
                    )],
                    voting_payout_phases: vec![get_default_voting_payout_phase(
                        SharedPayoutPhaseFields {
                            index: 1,
                            payout_basis_points: percent_to_basis_points(50),
                            payout_time: get_days_ahead_unix_time(50),
                            refund_deadline: get_days_ahead_unix_time(55),
                            description: String::from("Voting payout phase."),
                        },
                    )],
                },
            },
        ]
    }

    #[test]
    fn test_payout_phases_valid_cases() {
        let payout_phases = get_valid_payout_phases_for_test();

        assert!(payout_phases.assert_is_valid(0).is_ok());

        for (index, payout_phase_enum) in payout_phases.to_ordered_list().into_iter().enumerate() {
            assert_eq!(
                PayoutPhaseEnum::get_index(&payout_phase_enum) as usize,
                index
            );
        }
    }

    #[test]
    fn test_payout_phases_invalid_cases() {
        for invalid_case in get_invalid_payout_phases_for_test().iter() {
            assert!(
                invalid_case.payout_phases.assert_is_valid(0).is_err(),
                "Invalid test case failed for test case with label: {}",
                invalid_case.label
            );
        }
    }

    #[test]
    fn test_get_next_payout_phase_for_payout() {
        let mut payout_phases = get_valid_payout_phases_for_test();

        let payout_ready = payout_phases.get_current_active_payout_phase_for_payout();

        match payout_ready {
            Some(payout_phase) => match payout_phase {
                PayoutPhaseEnum::NonVoting(val) => {
                    assert_eq!(val.shared_fields.index, 0);
                    assert_eq!(
                        val.shared_fields.payout_basis_points,
                        percent_to_basis_points(50)
                    );
                    assert_eq!(val.shared_fields.payout_time, get_days_ahead_unix_time(10));
                    assert_eq!(
                        val.shared_fields.refund_deadline,
                        get_days_ahead_unix_time(41)
                    );
                }
                PayoutPhaseEnum::Voting(_) => {
                    panic!("Value should be a PayoutPhaseEnum::NonVoting.")
                }
            },
            None => panic!("Value should be a Some variant."),
        }

        payout_phases.mark_current_active_payout_phase_as_disbursed();

        let payout_ready = payout_phases.get_current_active_payout_phase_for_payout();

        match payout_ready {
            Some(payout_phase) => match payout_phase {
                PayoutPhaseEnum::Voting(val) => {
                    assert_eq!(val.shared_fields.index, 1);
                    assert_eq!(
                        val.shared_fields.payout_basis_points,
                        percent_to_basis_points(20)
                    );
                    assert_eq!(val.shared_fields.payout_time, get_days_ahead_unix_time(100));
                    assert_eq!(
                        val.shared_fields.refund_deadline,
                        get_days_ahead_unix_time(131)
                    );
                }
                PayoutPhaseEnum::NonVoting(_) => {
                    panic!("Value should be a PayoutPhaseEnum::Voting.")
                }
            },
            None => panic!("Value should be a Some variant."),
        }
    }
}
