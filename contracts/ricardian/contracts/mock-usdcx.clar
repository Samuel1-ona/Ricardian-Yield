;; title: mock-usdcx.clar
;; version: 1.0.0
;; summary: Mock USDCx token contract for testing
;; description: Implements SIP-010 fungible token standard for testing purposes

(define-constant contract-owner tx-sender)

;; Error codes
(define-constant ERR-NOT-AUTHORIZED (err u100))
(define-constant ERR-INVALID-AMOUNT (err u101))
(define-constant ERR-INSUFFICIENT-BALANCE (err u102))
(define-constant ERR-INVALID-SENDER (err u103))
(define-constant ERR-INVALID-RECIPIENT (err u104))

;; Fungible token
(define-fungible-token usdcx)

;; Mint tokens (for testing)
(define-public (mint (amount uint) (recipient principal))
  (begin
    (asserts! (is-eq tx-sender contract-owner) ERR-NOT-AUTHORIZED)
    (asserts! (> amount u0) ERR-INVALID-AMOUNT)
    (try! (ft-mint? usdcx amount recipient))
    (ok true)
  )
)

;; SIP-010 required functions
(define-read-only (get-name)
  (ok "USD Coin Extended")
)

(define-read-only (get-symbol)
  (ok "USDCx")
)

(define-read-only (get-decimals)
  (ok u6)
)

(define-read-only (get-balance (account principal))
  (ok (ft-get-balance usdcx account))
)

(define-read-only (get-total-supply)
  (ok (ft-get-supply usdcx))
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
    (try! (ft-transfer? usdcx amount sender recipient))
    (match memo memo-value
      (begin (print memo-value) (ok true))
      (ok true)
    )
  )
)

