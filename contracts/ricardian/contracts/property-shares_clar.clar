;; title: property-shares.clar
;; version: 1.0.0
;; summary: Property Shares contract implementing SIP-010
;; description: Fractional ownership tokens (ERC-20 equivalent) for property shares

(define-constant contract-owner tx-sender)

;; Error codes
(define-constant ERR-NOT-AUTHORIZED (err u100))
(define-constant ERR-ALREADY-INITIALIZED (err u101))
(define-constant ERR-INVALID-SUPPLY (err u102))
(define-constant ERR-NOT-FOUND (err u103))
(define-constant ERR-INVALID-PROPERTY-ID (err u104))
(define-constant ERR-INVALID-AMOUNT (err u105))
(define-constant ERR-INVALID-PROPERTY-NFT (err u106))
(define-constant ERR-INVALID-OWNER (err u107))
(define-constant ERR-INVALID-RECIPIENT (err u108))
(define-constant ERR-INVALID-SENDER (err u109))

;; Fungible token
(define-fungible-token property-shares)

;; Property shares data
(define-map property-shares-data 
  {property-id: uint} 
  {
    property-nft: principal,
    nft-property-id: uint,
    total-supply: uint,
    initialized: bool
  }
)

;; Track shares per property
(define-map shares-by-property 
  {property-id: uint} 
  {owner: principal}
)

;; Initialize shares for a property
(define-public (initialize 
  (property-nft principal) 
  (property-id uint) 
  (total-supply uint) 
  (initial-owner principal))
  (begin
    (asserts! (is-eq tx-sender contract-owner) ERR-NOT-AUTHORIZED)
    (asserts! (> property-id u0) ERR-INVALID-PROPERTY-ID)
    (asserts! (not (is-eq property-nft (as-contract tx-sender))) ERR-INVALID-PROPERTY-NFT)
    (asserts! (> total-supply u0) ERR-INVALID-SUPPLY)
    (asserts! (not (is-eq initial-owner (as-contract tx-sender))) ERR-INVALID-OWNER)
    (asserts! (is-none (map-get? property-shares-data {property-id: property-id})) ERR-ALREADY-INITIALIZED)
    
    (map-set property-shares-data 
      {property-id: property-id}
      {
        property-nft: property-nft,
        nft-property-id: property-id,
        total-supply: total-supply,
        initialized: true
      }
    )
    
    (map-set shares-by-property 
      {property-id: property-id}
      {owner: contract-owner}
    )
    
    (try! (ft-mint? property-shares total-supply initial-owner))
    (ok true)
  )
)

;; Mint additional shares (owner only)
(define-public (mint 
  (property-id uint) 
  (amount uint) 
  (recipient principal))
  (begin
    (asserts! (is-eq tx-sender contract-owner) ERR-NOT-AUTHORIZED)
    (asserts! (> property-id u0) ERR-INVALID-PROPERTY-ID)
    (asserts! (> amount u0) ERR-INVALID-AMOUNT)
    (asserts! (not (is-eq recipient (as-contract tx-sender))) ERR-INVALID-RECIPIENT)
    (asserts! (is-some (map-get? property-shares-data {property-id: property-id})) ERR-NOT-FOUND)
    
    (try! (ft-mint? property-shares amount recipient))
    (ok true)
  )
)

;; Get property shares data
(define-read-only (get-property-shares-data (property-id uint))
  (if (> property-id u0)
    (ok (map-get? property-shares-data {property-id: property-id}))
    ERR-INVALID-PROPERTY-ID
  )
)

;; Get total supply for a property
(define-read-only (get-total-supply-by-property (property-id uint))
  (if (> property-id u0)
    (match (map-get? property-shares-data {property-id: property-id})
      data (ok (get total-supply data))
      ERR-NOT-FOUND
    )
    ERR-INVALID-PROPERTY-ID
  )
)

;; Get property owner from shares-by-property map
(define-read-only (get-property-owner (property-id uint))
  (if (> property-id u0)
    (match (map-get? shares-by-property {property-id: property-id})
      owner-data (ok (get owner owner-data))
      ERR-NOT-FOUND
    )
    ERR-INVALID-PROPERTY-ID
  )
)

;; SIP-010 required functions
(define-read-only (get-name)
  (ok "Property Shares")
)

(define-read-only (get-symbol)
  (ok "PSHARE")
)

(define-read-only (get-decimals)
  (ok u6)
)

(define-read-only (get-balance (account principal))
  (ok (ft-get-balance property-shares account))
)

(define-read-only (get-total-supply)
  (ok (ft-get-supply property-shares))
)

(define-read-only (get-token-uri)
  (ok (some ""))
)

(define-public (transfer 
  (amount uint) 
  (sender principal) 
  (recipient principal) 
  (memo (optional (buff 34))))
  (begin
    (asserts! (> amount u0) ERR-INVALID-AMOUNT)
    (asserts! (is-eq tx-sender sender) ERR-INVALID-SENDER)
    (asserts! (not (is-eq recipient (as-contract tx-sender))) ERR-INVALID-RECIPIENT)
    (asserts! (not (is-eq sender recipient)) ERR-INVALID-RECIPIENT)
    (try! (ft-transfer? property-shares amount sender recipient))
    (match memo memo-value
      (begin (print memo-value) (ok true))
      (ok true)
    )
  )
)