;; title: trait-simple-dao
;; version: 1.0.0
;; summary: Trait definition for Simple DAO contract
;; description: Defines the interface for DAO governance and CapEx proposal management

(define-trait trait-simple-dao
  (
    (create-proposal (uint uint (string-ascii 200)) (response uint uint))
    (approve-proposal (uint uint) (response bool uint))
    (is-proposal-approved (uint uint) (response bool uint))
    (get-proposal (uint uint) (response (tuple (amount uint) (description (string-ascii 200)) (approved bool) (proposer principal)) uint))
    (get-proposal-count (uint) (response uint uint))
  )
)
