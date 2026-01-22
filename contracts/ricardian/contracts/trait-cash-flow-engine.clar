;; title: trait-cash-flow-engine
;; version: 1.0.0
;; summary: Trait definition for Cash Flow Engine contract
;; description: Defines the interface for cash flow calculations and expense tracking

(define-trait trait-cash-flow-engine
  (
    (record-operating-expense (uint uint) (response bool uint))
    (record-capex (uint uint uint) (response bool uint))
    (allocate-working-capital (uint uint) (response bool uint))
    (release-working-capital (uint uint) (response bool uint))
    (get-distributable-cash-flow (uint) (response uint uint))
    (get-operating-expenses (uint) (response uint uint))
    (get-working-capital-reserve (uint) (response uint uint))
    (get-capex-spent (uint) (response uint uint))
    (reset-period (uint) (response bool uint))
  )
)
