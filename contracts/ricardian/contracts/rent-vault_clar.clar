;; title: rent-vault.clar
;; version: 1.0.0
;; summary: Rent Vault contract for receiving and holding USDCx rent payments
;; description: Receives USDCx deposits via SIP-010 transfers and tracks rent per period

(define-constant contract-owner tx-sender)
(define-constant usdcx-token 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.usdcx)

;; Error codes
(define-constant ERR-NOT-AUTHORIZED (err u100))
(define-constant ERR-INVALID-AMOUNT (err u101))
(define-constant ERR-INVALID-PROPERTY-ID (err u102))
(define-constant ERR-NOT-AUTHORIZED-CALLER (err u103))
(define-constant ERR-INSUFFICIENT-BALANCE (err u104))
(define-constant ERR-PROPERTY-NOT-FOUND (err u105))
(define-constant ERR-INVALID-ADDRESS (err u106))
(define-constant ERR-INVALID-RECIPIENT (err u107))

;; Property rent data
(define-map property-rent 
  {property-id: uint}
  {
    balance: uint,
    rent-collected: uint,
    current-period: uint
  }
)

;; Rent per period tracking - composite key
(define-map rent-per-period 
  {property-id: uint, period: uint}
  {amount: uint}
)

;; Authorized addresses (yield distributor, cash flow engine)
(define-map authorized 
  {address: principal}
  {is-authorized: bool}
)



;; Set property NFT contract


;; Add authorized address
(define-public (set-authorized (address principal) (is-auth bool))
  (begin
    (asserts! (is-eq tx-sender contract-owner) ERR-NOT-AUTHORIZED)
    (asserts! (not (is-eq address (as-contract tx-sender))) ERR-INVALID-ADDRESS)
    (map-set authorized 
      {address: address}
      {is-authorized: is-auth}
    )
    (ok true)
  )
)

;; Check if address is authorized
(define-private (is-authorized (address principal))
  (default-to false 
    (get is-authorized (map-get? authorized {address: address}))
  )
)

;; Deposit rent - records rent deposit after user transfers USDCx to this contract
;; User must transfer tokens to this contract first, then call this function to update records
;; Note: This function assumes tokens were already transferred and just updates the records
(define-public (deposit-rent (property-id uint) (amount uint))
  (begin
    (asserts! (> property-id u0) ERR-INVALID-PROPERTY-ID)
    (asserts! (> amount u0) ERR-INVALID-AMOUNT)
    
    ;; Update property rent data
    (match (map-get? property-rent {property-id: property-id})
      existing (let (
        (current-period (get current-period existing))
        (new-balance (+ (get balance existing) amount))
        (new-rent-collected (+ (get rent-collected existing) amount))
      )
        (begin
          (map-set property-rent 
            {property-id: property-id}
            {
              balance: new-balance,
              rent-collected: new-rent-collected,
              current-period: current-period
            }
          )
          
          ;; Update rent for current period
          (let (
            (period-rent (default-to u0 
              (get amount (map-get? rent-per-period {property-id: property-id, period: current-period}))
            ))
          )
            (map-set rent-per-period 
              {property-id: property-id, period: current-period}
              {amount: (+ period-rent amount)}
            )
          )
          (ok true)
        )
      )
      ;; First deposit for this property
      (begin
        (map-set property-rent 
          {property-id: property-id}
          {
            balance: amount,
            rent-collected: amount,
            current-period: u0
          }
        )
        (map-set rent-per-period 
          {property-id: property-id, period: u0}
          {amount: amount}
        )
        (ok true)
      )
    )
  )
)

;; Withdraw USDCx (authorized only)
(define-public (withdraw (property-id uint) (to principal) (amount uint))
  (begin
    (asserts! (> property-id u0) ERR-INVALID-PROPERTY-ID)
    (asserts! (> amount u0) ERR-INVALID-AMOUNT)
    (asserts! (not (is-eq to (as-contract tx-sender))) ERR-INVALID-RECIPIENT)
    (asserts! 
      (or (is-eq tx-sender contract-owner) (is-authorized tx-sender)) 
      ERR-NOT-AUTHORIZED-CALLER
    )
    
    (match (map-get? property-rent {property-id: property-id})
      property (begin
        (asserts! (>= (get balance property) amount) ERR-INSUFFICIENT-BALANCE)
        
        (map-set property-rent 
          {property-id: property-id}
          {
            balance: (- (get balance property) amount),
            rent-collected: (get rent-collected property),
            current-period: (get current-period property)
          }
        )
        
        (as-contract (contract-call? usdcx-token transfer amount tx-sender to none))
      )
      ERR-PROPERTY-NOT-FOUND
    )
  )
)

;; Get balance for a property
(define-read-only (get-balance (property-id uint))
  (if (> property-id u0)
    (match (map-get? property-rent {property-id: property-id})
      property (ok (get balance property))
      (ok u0)
    )
    ERR-INVALID-PROPERTY-ID
  )
)

;; Get rent for a specific period
(define-read-only (get-rent-for-period (property-id uint) (period uint))
  (if (> property-id u0)
    (ok (default-to u0 
      (get amount (map-get? rent-per-period {property-id: property-id, period: period}))
    ))
    ERR-INVALID-PROPERTY-ID
  )
)

;; Get current period
(define-read-only (get-current-period (property-id uint))
  (if (> property-id u0)
    (match (map-get? property-rent {property-id: property-id})
      property (ok (get current-period property))
      (ok u0)
    )
    ERR-INVALID-PROPERTY-ID
  )
)

;; Get property rent data
(define-read-only (get-property-rent-data (property-id uint))
  (if (> property-id u0)
    (ok (map-get? property-rent {property-id: property-id}))
    ERR-INVALID-PROPERTY-ID
  )
)

;; Reset period (owner only)
(define-public (reset-period (property-id uint))
  (begin
    (asserts! (> property-id u0) ERR-INVALID-PROPERTY-ID)
    (asserts! (is-eq tx-sender contract-owner) ERR-NOT-AUTHORIZED)
    
    (match (map-get? property-rent {property-id: property-id})
      property (begin
        (map-set property-rent 
          {property-id: property-id}
          {
            balance: (get balance property),
            rent-collected: (get rent-collected property),
            current-period: (+ (get current-period property) u1)
          }
        )
        (ok true)
      )
      ERR-PROPERTY-NOT-FOUND
    )
  )
)

;; Get total rent collected
(define-read-only (get-rent-collected (property-id uint))
  (if (> property-id u0)
    (match (map-get? property-rent {property-id: property-id})
      property (ok (get rent-collected property))
      (ok u0)
    )
    ERR-INVALID-PROPERTY-ID
  )
)