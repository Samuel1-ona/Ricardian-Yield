;; title: property-nft.clar
;; version: 1.0.0
;; summary: Property NFT contract implementing SIP-009

(define-constant contract-owner tx-sender)

;; Error codes
(define-constant ERR-NOT-AUTHORIZED (err u100))
(define-constant ERR-INVALID-PROPERTY-ID (err u101))
(define-constant ERR-NOT-FOUND (err u102))
(define-constant ERR-INVALID-OWNER (err u104))
(define-constant ERR-INVALID-LOCATION (err u105))
(define-constant ERR-INVALID-VALUATION (err u106))
(define-constant ERR-INVALID-RENT (err u107))
(define-constant ERR-INVALID-METADATA-URI (err u108))
(define-constant ERR-INVALID-RECIPIENT (err u109))
(define-constant ERR-PROPERTY-NOT-EXISTS (err u110))
(define-constant ERR-NOT-TOKEN-OWNER (err u111))

;; NFT asset
(define-non-fungible-token property-nft uint)

;; Property data structure
(define-map property-data 
  {property-id: uint}
  {
    owner: principal,
    location: (string-ascii 200),
    valuation: uint,
    monthly-rent: uint,
    metadata-uri: (string-ascii 200)
  }
)

;; Track next property ID
(define-data-var next-property-id uint u1)

;; Track total supply
(define-data-var total-supply uint u0)

;; Mint a new property NFT
(define-public (mint-property 
  (owner principal)
  (location (string-ascii 200))
  (valuation uint)
  (monthly-rent uint)
  (metadata-uri (string-ascii 200)))
  (let ((property-id (var-get next-property-id)))
    (begin
      (asserts! (is-eq tx-sender contract-owner) ERR-NOT-AUTHORIZED)
      (asserts! (> property-id u0) ERR-INVALID-PROPERTY-ID)
      
      ;; Validate owner - must not be the contract itself
      (asserts! (not (is-eq owner (as-contract tx-sender))) ERR-INVALID-OWNER)
      
      ;; Validate location - must not be empty
      (asserts! (> (len location) u0) ERR-INVALID-LOCATION)
      
      ;; Validate valuation - must be greater than zero
      (asserts! (> valuation u0) ERR-INVALID-VALUATION)
      
      ;; Validate monthly rent - must be greater than zero
      (asserts! (> monthly-rent u0) ERR-INVALID-RENT)
      
      ;; Validate metadata URI - must not be empty
      (asserts! (> (len metadata-uri) u0) ERR-INVALID-METADATA-URI)
      
      (map-set property-data 
        {property-id: property-id}
        {
          owner: owner,
          location: location,
          valuation: valuation,
          monthly-rent: monthly-rent,
          metadata-uri: metadata-uri
        }
      )
      
      (try! (nft-mint? property-nft property-id owner))
      (var-set next-property-id (+ property-id u1))
      (var-set total-supply (+ (var-get total-supply) u1))
      (ok property-id)
    )
  )
)

;; Transfer property NFT
(define-public (transfer 
  (token-id uint)
  (sender principal)
  (recipient principal))
  (begin
    ;; Validate token-id - must be greater than zero
    (asserts! (> token-id u0) ERR-INVALID-PROPERTY-ID)
    
    ;; Validate sender - must be the transaction sender
    (asserts! (is-eq tx-sender sender) ERR-NOT-AUTHORIZED)
    
    ;; Validate recipient - must not be the contract itself
    (asserts! (not (is-eq recipient (as-contract tx-sender))) ERR-INVALID-RECIPIENT)
    
    ;; Validate recipient - must not be the same as sender
    (asserts! (not (is-eq sender recipient)) ERR-INVALID-RECIPIENT)
    
    ;; Validate property exists
    (asserts! (is-some (map-get? property-data {property-id: token-id})) ERR-PROPERTY-NOT-EXISTS)
    
    ;; Validate sender is the actual owner of the token
    (match (nft-get-owner? property-nft token-id)
      owner (asserts! (is-eq owner sender) ERR-NOT-TOKEN-OWNER)
      (asserts! false ERR-PROPERTY-NOT-EXISTS)
    )
    
    (try! (nft-transfer? property-nft token-id sender recipient))
    
    ;; Update owner in property data
    (match (map-get? property-data {property-id: token-id})
      property-info (map-set property-data 
        {property-id: token-id}
        (merge property-info {owner: recipient})
      )
      false
    )
    (ok true)
  )
)

;; Get property data
(define-read-only (get-property-data (property-id uint))
  (ok (map-get? property-data {property-id: property-id}))
)

;; Get total supply
(define-read-only (get-total-supply)
  (ok (var-get total-supply))
)

;; SIP-009 required functions
(define-read-only (get-last-token-id)
  (ok (- (var-get next-property-id) u1))
)

(define-read-only (get-token-uri (token-id uint))
  (match (map-get? property-data {property-id: token-id})
    property (ok (some (get metadata-uri property)))
    ERR-NOT-FOUND
  )
)

(define-read-only (get-owner (token-id uint))
  (ok (nft-get-owner? property-nft token-id))
)

;; Additional helper functions
(define-read-only (get-property-location (property-id uint))
  (match (map-get? property-data {property-id: property-id})
    property (ok (get location property))
    ERR-NOT-FOUND
  )
)

(define-read-only (get-property-valuation (property-id uint))
  (match (map-get? property-data {property-id: property-id})
    property (ok (get valuation property))
    ERR-NOT-FOUND
  )
)

(define-read-only (get-property-monthly-rent (property-id uint))
  (match (map-get? property-data {property-id: property-id})
    property (ok (get monthly-rent property))
    ERR-NOT-FOUND
  )
)