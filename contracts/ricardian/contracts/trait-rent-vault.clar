;; title: trait-rent-vault
;; version: 1.0.0
;; summary: Trait definition for Rent Vault contract
;; description: Defines the interface for rent vault operations including deposits, withdrawals, and period management

(define-trait trait-rent-vault
  (
    (withdraw (uint principal uint) (response bool uint))
    (get-balance (uint) (response uint uint))
    (get-rent-for-period (uint uint) (response uint uint))
    (current-period (uint) (response uint uint))
    (reset-period (uint) (response bool uint))
  )
)
