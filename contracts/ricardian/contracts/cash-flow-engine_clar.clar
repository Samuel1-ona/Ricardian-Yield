;; title: cash-flow-engine.clar
;; version: 1.0.0
;; summary: Cash Flow Engine contract for calculating distributable cash flow
;; description: Tracks operating expenses, CapEx, and working capital reserves



(define-constant contract-owner tx-sender)

;; Error codes
(define-constant ERR-NOT-AUTHORIZED (err u100))
(define-constant ERR-INVALID-AMOUNT (err u101))
(define-constant ERR-INVALID-PROPERTY-ID (err u102))
(define-constant ERR-NOT-PROPERTY-OWNER (err u103))
(define-constant ERR-CONTRACT-NOT-SET (err u104))
(define-constant ERR-INVALID-PROPOSAL-ID (err u105))
(define-constant ERR-PROPOSAL-NOT-APPROVED (err u106))
(define-constant ERR-INSUFFICIENT-RESERVE (err u107))
(define-constant ERR-NO-ACCOUNTING-DATA (err u108))

;; Property accounting data
(define-map property-accounting 
  {property-id: uint}
  {
    operating-expenses: uint,
    capex-spent: uint,
    working-capital-reserve: uint,
    last-capex-change: uint,
    last-working-capital-change: int
  }
)


;; Check if caller is property owner
(define-private (is-property-owner (property-id uint) (caller principal))
  (let ((owner-opt (unwrap! (contract-call? .property-nft_clar get-owner property-id) false)))
    (match owner-opt
      owner (is-eq owner caller)
      false
    )
  )
)

;; Record operating expense (property owner only)
(define-public (record-operating-expense (property-id uint) (amount uint))
  (begin
    (asserts! (> property-id u0) ERR-INVALID-PROPERTY-ID)
    (asserts! (> amount u0) ERR-INVALID-AMOUNT)
    (asserts! (is-property-owner property-id tx-sender) ERR-NOT-PROPERTY-OWNER)
    
    (match (map-get? property-accounting {property-id: property-id})
      existing (begin
        (map-set property-accounting 
          {property-id: property-id}
          {
            operating-expenses: (+ (get operating-expenses existing) amount),
            capex-spent: (get capex-spent existing),
            working-capital-reserve: (get working-capital-reserve existing),
            last-capex-change: (get last-capex-change existing),
            last-working-capital-change: (get last-working-capital-change existing)
          }
        )
        (ok true)
      )
      (begin
        (map-set property-accounting 
          {property-id: property-id}
          {
            operating-expenses: amount,
            capex-spent: u0,
            working-capital-reserve: u0,
            last-capex-change: u0,
            last-working-capital-change: 0
          }
        )
        (ok true)
      )
    )
  )
)

;; Record CapEx (DAO only)
(define-public (record-capex (property-id uint) (amount uint) (proposal-id uint))
  (begin
    (asserts! (> property-id u0) ERR-INVALID-PROPERTY-ID)
    (asserts! (> amount u0) ERR-INVALID-AMOUNT)
    (asserts! (> proposal-id u0) ERR-INVALID-PROPOSAL-ID)
    (let ((approved (unwrap! (contract-call? .simple-dao_clar is-proposal-approved property-id proposal-id) ERR-PROPOSAL-NOT-APPROVED)))
      (asserts! approved ERR-PROPOSAL-NOT-APPROVED)
      (match (map-get? property-accounting {property-id: property-id})
        existing (begin
          (map-set property-accounting 
            {property-id: property-id}
            {
              operating-expenses: (get operating-expenses existing),
              capex-spent: (+ (get capex-spent existing) amount),
              working-capital-reserve: (get working-capital-reserve existing),
              last-capex-change: amount,
              last-working-capital-change: (get last-working-capital-change existing)
            }
          )
          (ok true)
        )
        (begin
          (map-set property-accounting 
            {property-id: property-id}
            {
              operating-expenses: u0,
              capex-spent: amount,
              working-capital-reserve: u0,
              last-capex-change: amount,
              last-working-capital-change: 0
            }
          )
          (ok true)
        )
      )
    )
  )
)

;; Allocate working capital
(define-public (allocate-working-capital (property-id uint) (amount uint))
  (begin
    (asserts! (> property-id u0) ERR-INVALID-PROPERTY-ID)
    (asserts! (> amount u0) ERR-INVALID-AMOUNT)
    (asserts! (is-property-owner property-id tx-sender) ERR-NOT-PROPERTY-OWNER)
    
    (match (map-get? property-accounting {property-id: property-id})
      existing (begin
        (map-set property-accounting 
          {property-id: property-id}
          {
            operating-expenses: (get operating-expenses existing),
            capex-spent: (get capex-spent existing),
            working-capital-reserve: (+ (get working-capital-reserve existing) amount),
            last-capex-change: (get last-capex-change existing),
            last-working-capital-change: (to-int amount)
          }
        )
        (ok true)
      )
      (begin
        (map-set property-accounting 
          {property-id: property-id}
          {
            operating-expenses: u0,
            capex-spent: u0,
            working-capital-reserve: amount,
            last-capex-change: u0,
            last-working-capital-change: (to-int amount)
          }
        )
        (ok true)
      )
    )
  )
)

;; Release working capital
(define-public (release-working-capital (property-id uint) (amount uint))
  (begin
    (asserts! (> property-id u0) ERR-INVALID-PROPERTY-ID)
    (asserts! (> amount u0) ERR-INVALID-AMOUNT)
    (asserts! (is-property-owner property-id tx-sender) ERR-NOT-PROPERTY-OWNER)
    
    (match (map-get? property-accounting {property-id: property-id})
      existing (begin
        (asserts! (>= (get working-capital-reserve existing) amount) ERR-INSUFFICIENT-RESERVE)
        (map-set property-accounting 
          {property-id: property-id}
          {
            operating-expenses: (get operating-expenses existing),
            capex-spent: (get capex-spent existing),
            working-capital-reserve: (- (get working-capital-reserve existing) amount),
            last-capex-change: (get last-capex-change existing),
            last-working-capital-change: (* (to-int amount) -1)
          }
        )
        (ok true)
      )
      ERR-NO-ACCOUNTING-DATA
    )
  )
)

;; Get distributable cash flow
(define-public (get-distributable-cash-flow (property-id uint))
  (begin
    (asserts! (> property-id u0) ERR-INVALID-PROPERTY-ID)
    (let ((rent-balance (unwrap! (contract-call? .rent-vault_clar get-balance property-id) ERR-CONTRACT-NOT-SET)))
    (match (map-get? property-accounting {property-id: property-id})
      accounting (let (
        (expenses (get operating-expenses accounting))
        (reserve (get working-capital-reserve accounting))
      )
        (if (> rent-balance (+ expenses reserve))
          (ok (- rent-balance (+ expenses reserve)))
          (ok u0)
        )
      )
      (ok rent-balance)
    )
    )
  )
)

;; Get operating expenses
(define-read-only (get-operating-expenses (property-id uint))
  (if (> property-id u0)
    (match (map-get? property-accounting {property-id: property-id})
      accounting (ok (get operating-expenses accounting))
      (ok u0)
    )
    ERR-INVALID-PROPERTY-ID
  )
)

;; Get working capital reserve
(define-read-only (get-working-capital-reserve (property-id uint))
  (if (> property-id u0)
    (match (map-get? property-accounting {property-id: property-id})
      accounting (ok (get working-capital-reserve accounting))
      (ok u0)
    )
    ERR-INVALID-PROPERTY-ID
  )
)

;; Get CapEx spent
(define-read-only (get-capex-spent (property-id uint))
  (if (> property-id u0)
    (match (map-get? property-accounting {property-id: property-id})
      accounting (ok (get capex-spent accounting))
      (ok u0)
    )
    ERR-INVALID-PROPERTY-ID
  )
)

;; Get full accounting data
(define-read-only (get-accounting-data (property-id uint))
  (if (> property-id u0)
    (ok (map-get? property-accounting {property-id: property-id}))
    ERR-INVALID-PROPERTY-ID
  )
)

;; Reset period (owner only)
(define-public (reset-period (property-id uint))
  (begin
    (asserts! (> property-id u0) ERR-INVALID-PROPERTY-ID)
    (asserts! (is-eq tx-sender contract-owner) ERR-NOT-AUTHORIZED)
    
    (match (map-get? property-accounting {property-id: property-id})
      existing (begin
        (map-set property-accounting 
          {property-id: property-id}
          {
            operating-expenses: u0,
            capex-spent: (get capex-spent existing),
            working-capital-reserve: (get working-capital-reserve existing),
            last-capex-change: u0,
            last-working-capital-change: 0
          }
        )
        (ok true)
      )
      (ok true)
    )
  )
)