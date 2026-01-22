;; title: trait-property-nft
;; version: 1.0.0
;; summary: Trait definition for Property NFT contract
;; description: Defines the interface for property NFT operations

(define-trait trait-property-nft
  (
    (get-owner (uint) (response (optional principal) uint))
    (get-property-data (uint) (response (optional (tuple (owner principal) (location (string-ascii 200)) (valuation uint) (monthly-rent uint) (metadata-uri (string-ascii 200)))) uint))
    (get-total-supply () (response uint uint))
    (get-last-token-id () (response uint uint))
    (get-token-uri (uint) (response (optional (string-ascii 200)) uint))
    (get-property-location (uint) (response (string-ascii 200) uint))
    (get-property-valuation (uint) (response uint uint))
    (get-property-monthly-rent (uint) (response uint uint))
  )
)

