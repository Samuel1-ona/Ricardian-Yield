;; title: yield-distributor.clar
;; version: 1.0.0
;; summary: Yield Distributor contract for distributing yield to shareholders
;; description: Creates distribution snapshots and allows shareholders to claim their proportional yield



(define-constant contract-owner tx-sender)
(define-constant usdcx-token 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.usdcx)

;; Error codes
(define-constant ERR-NOT-AUTHORIZED (err u100))
(define-constant ERR-INVALID-PROPERTY-ID (err u101))
(define-constant ERR-INVALID-PERIOD (err u102))
(define-constant ERR-NO-DISTRIBUTABLE (err u103))
(define-constant ERR-NO-SUPPLY (err u104))
(define-constant ERR-INVALID-USER (err u105))
(define-constant ERR-NO-DISTRIBUTION (err u106))
(define-constant ERR-ALREADY-CLAIMED (err u107))
(define-constant ERR-NO-BALANCE (err u108))
(define-constant ERR-NO-YIELD (err u109))
(define-constant ERR-DISTRIBUTION-NOT-FOUND (err u110))

;; Distribution data per property and period
(define-map distributions 
  {property-id: uint, period: uint}
  {
    total-distributable: uint,
    snapshot-supply: uint
  }
)

;; Track claimed amounts per user, property, and period
(define-map claimed 
  {property-id: uint, period: uint, user: principal}
  {amount: uint}
)

;; Current distribution period per property
(define-map current-period 
  {property-id: uint}
  {period: uint}
)



;; Distribute yield for a property (owner only)
(define-public (distribute-yield (property-id uint))
  (begin
    (asserts! (> property-id u0) ERR-INVALID-PROPERTY-ID)
    (asserts! (is-eq tx-sender contract-owner) ERR-NOT-AUTHORIZED)
    
    (match (contract-call? .cash-flow-engine_clar get-distributable-cash-flow property-id)
      distributable (begin
        (asserts! (> distributable u0) ERR-NO-DISTRIBUTABLE)
        
        (let (
          (total-supply (unwrap! (contract-call? .property-shares_clar get-total-supply) ERR-NO-SUPPLY))
        )
          (begin
            (asserts! (> total-supply u0) ERR-NO-SUPPLY)
            
            (match (as-contract (contract-call? .rent-vault_clar withdraw property-id tx-sender distributable))
              result (let (
                (period (default-to u0 
                  (get period (map-get? current-period {property-id: property-id}))
                ))
              )
                (begin
                  (map-set distributions 
                    {property-id: property-id, period: period}
                    {
                      total-distributable: distributable,
                      snapshot-supply: total-supply
                    }
                  )
                  (ok true)
                )
              )
              e (err e)
            )
          )
        )
      )
      e (err e)
    )
  )
)

;; Claim yield for a period
(define-public (claim-yield (property-id uint) (period uint))
  (begin
    (asserts! (> property-id u0) ERR-INVALID-PROPERTY-ID)
    (asserts! (>= period u0) ERR-INVALID-PERIOD)
    (match (map-get? distributions {property-id: property-id, period: period})
      distribution (begin
        (asserts! (> (get total-distributable distribution) u0) ERR-NO-DISTRIBUTION)
        (asserts! 
          (is-none (map-get? claimed {property-id: property-id, period: period, user: tx-sender})) 
          ERR-ALREADY-CLAIMED
        )
        
        (let (
          (user-balance (unwrap! (contract-call? .property-shares_clar get-balance tx-sender) ERR-NO-BALANCE))
        )
          (begin
            (asserts! (> user-balance u0) ERR-NO-BALANCE)
            
            (let (
              (snapshot-supply (get snapshot-supply distribution))
              (total-distributable (get total-distributable distribution))
              (yield-amount (/ (* total-distributable user-balance) snapshot-supply))
            )
              (begin
                (asserts! (> yield-amount u0) ERR-NO-YIELD)
                
                (map-set claimed 
                  {property-id: property-id, period: period, user: tx-sender}
                  {amount: yield-amount}
                )
                
                ;; Transfer USDCx to user
                (try! (as-contract (contract-call? usdcx-token transfer yield-amount tx-sender (unwrap-panic (some tx-sender)) none)))
                (ok yield-amount)
              )
            )
          )
        )
      )
      ERR-DISTRIBUTION-NOT-FOUND
    )
  )
)

;; Get claimable yield for a user
(define-public (get-claimable-yield (property-id uint) (period uint) (user principal))
  (begin
    (asserts! (> property-id u0) ERR-INVALID-PROPERTY-ID)
    (asserts! (>= period u0) ERR-INVALID-PERIOD)
    (asserts! (not (is-eq user (as-contract tx-sender))) ERR-INVALID-USER)
    (match (map-get? distributions {property-id: property-id, period: period})
    distribution 
      (if (is-some (map-get? claimed {property-id: property-id, period: period, user: user}))
        (ok u0)
        (let (
          (user-balance (unwrap-panic (contract-call? .property-shares_clar get-balance user)))
        )
          (let (
            (snapshot-supply (get snapshot-supply distribution))
            (total-distributable (get total-distributable distribution))
          )
            (if (and (> user-balance u0) (> snapshot-supply u0))
              (ok (/ (* total-distributable user-balance) snapshot-supply))
              (ok u0)
            )
          )
        )
      )
    (ok u0)
    )
  )
)

;; Get distribution details
(define-read-only (get-distribution (property-id uint) (period uint))
  (if (and (> property-id u0) (>= period u0))
    (ok (map-get? distributions {property-id: property-id, period: period}))
    ERR-INVALID-PROPERTY-ID
  )
)

;; Check if user has claimed
(define-read-only (has-claimed (property-id uint) (period uint) (user principal))
  (if (and (> property-id u0) (>= period u0) (not (is-eq user (as-contract tx-sender))))
    (ok (is-some (map-get? claimed {property-id: property-id, period: period, user: user})))
    ERR-INVALID-PROPERTY-ID
  )
)

;; Get claimed amount
(define-read-only (get-claimed-amount (property-id uint) (period uint) (user principal))
  (if (and (> property-id u0) (>= period u0) (not (is-eq user (as-contract tx-sender))))
    (ok (default-to u0 
      (get amount (map-get? claimed {property-id: property-id, period: period, user: user}))
    ))
    ERR-INVALID-PROPERTY-ID
  )
)

;; Get current distribution period
(define-read-only (get-current-period (property-id uint))
  (if (> property-id u0)
    (ok (default-to u0 
      (get period (map-get? current-period {property-id: property-id}))
    ))
    ERR-INVALID-PROPERTY-ID
  )
)

;; Reset distribution period (owner only)
(define-public (reset-distribution-period (property-id uint))
  (begin
    (asserts! (> property-id u0) ERR-INVALID-PROPERTY-ID)
    (asserts! (is-eq tx-sender contract-owner) ERR-NOT-AUTHORIZED)
    
    (let (
      (current (default-to u0 
        (get period (map-get? current-period {property-id: property-id}))
      ))
    )
      (map-set current-period 
        {property-id: property-id}
        {period: (+ current u1)}
      )
      (ok true)
    )
  )
)