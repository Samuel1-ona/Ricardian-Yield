;; title: simple-dao.clar
;; version: 1.0.0
;; summary: Simple DAO contract for CapEx proposal governance
;; description: Allows shareholders to vote on capital expenditure proposals

(define-constant contract-owner tx-sender)

;; Error codes
(define-constant ERR-NOT-AUTHORIZED (err u100))
(define-constant ERR-INVALID-AMOUNT (err u101))
(define-constant ERR-NO-SHARES (err u103))
(define-constant ERR-ALREADY-VOTED (err u104))
(define-constant ERR-ALREADY-APPROVED (err u105))
(define-constant ERR-PROPOSAL-NOT-FOUND (err u106))
(define-constant ERR-INSUFFICIENT-VOTES (err u107))
(define-constant ERR-INVALID-PROPERTY-ID (err u108))
(define-constant ERR-INVALID-PROPOSAL-ID (err u109))
(define-constant ERR-INVALID-DESCRIPTION (err u110))
(define-constant ERR-INVALID-VOTER (err u111))

;; Proposal structure
(define-map proposals 
  {property-id: uint, proposal-id: uint}
  {
    amount: uint,
    description: (string-ascii 200),
    approved: bool,
    proposer: principal,
    votes-for: uint,
    votes-against: uint
  }
)

;; Track votes per proposal per voter
(define-map votes 
  {property-id: uint, proposal-id: uint, voter: principal}
  {voted: bool}
)

;; Proposal counts per property
(define-map proposal-counts 
  {property-id: uint}
  {count: uint}
)



;; Create a new CapEx proposal
(define-public (create-proposal 
  (property-id uint) 
  (amount uint) 
  (description (string-ascii 200)))
  (begin
    (asserts! (> property-id u0) ERR-INVALID-PROPERTY-ID)
    (asserts! (> amount u0) ERR-INVALID-AMOUNT)
    (asserts! (> (len description) u0) ERR-INVALID-DESCRIPTION)
    
    (let (
      (proposal-id (default-to u0 
        (get count (map-get? proposal-counts {property-id: property-id}))
      ))
    )
      (begin
        (map-set proposals 
          {property-id: property-id, proposal-id: proposal-id}
          {
            amount: amount,
            description: description,
            approved: false,
            proposer: tx-sender,
            votes-for: u0,
            votes-against: u0
          }
        )
        (map-set proposal-counts 
          {property-id: property-id}
          {count: (+ proposal-id u1)}
        )
        (ok proposal-id)
      )
    )
  )
)

;; Vote for a proposal (shareholders vote)
(define-public (vote-for-proposal (property-id uint) (proposal-id uint))
  (begin
    (asserts! (> property-id u0) ERR-INVALID-PROPERTY-ID)
    (asserts! (> proposal-id u0) ERR-INVALID-PROPOSAL-ID)
    (let ((balance (unwrap! (contract-call? .property-shares_clar get-balance tx-sender) ERR-NO-SHARES)))
      (begin
        (asserts! (> balance u0) ERR-NO-SHARES)
        (asserts! 
          (is-none (map-get? votes {property-id: property-id, proposal-id: proposal-id, voter: tx-sender})) 
          ERR-ALREADY-VOTED
        )
        
        (match (map-get? proposals {property-id: property-id, proposal-id: proposal-id})
          proposal (begin
            (asserts! (not (get approved proposal)) ERR-ALREADY-APPROVED)
            
            (map-set votes 
              {property-id: property-id, proposal-id: proposal-id, voter: tx-sender}
              {voted: true}
            )
            
            (map-set proposals 
              {property-id: property-id, proposal-id: proposal-id}
              {
                amount: (get amount proposal),
                description: (get description proposal),
                approved: (get approved proposal),
                proposer: (get proposer proposal),
                votes-for: (+ (get votes-for proposal) balance),
                votes-against: (get votes-against proposal)
              }
            )
            (ok true)
          )
          ERR-PROPOSAL-NOT-FOUND
        )
      )
    )
  )
)

;; Vote against a proposal
(define-public (vote-against-proposal (property-id uint) (proposal-id uint))
  (begin
    (asserts! (> property-id u0) ERR-INVALID-PROPERTY-ID)
    (asserts! (> proposal-id u0) ERR-INVALID-PROPOSAL-ID)
    (let ((balance (unwrap! (contract-call? .property-shares_clar get-balance tx-sender) ERR-NO-SHARES)))
      (begin
        (asserts! (> balance u0) ERR-NO-SHARES)
        (asserts! 
          (is-none (map-get? votes {property-id: property-id, proposal-id: proposal-id, voter: tx-sender})) 
          ERR-ALREADY-VOTED
        )
        
        (match (map-get? proposals {property-id: property-id, proposal-id: proposal-id})
          proposal (begin
            (asserts! (not (get approved proposal)) ERR-ALREADY-APPROVED)
            
            (map-set votes 
              {property-id: property-id, proposal-id: proposal-id, voter: tx-sender}
              {voted: true}
            )
            
            (map-set proposals 
              {property-id: property-id, proposal-id: proposal-id}
              {
                amount: (get amount proposal),
                description: (get description proposal),
                approved: (get approved proposal),
                proposer: (get proposer proposal),
                votes-for: (get votes-for proposal),
                votes-against: (+ (get votes-against proposal) balance)
              }
            )
            (ok true)
          )
          ERR-PROPOSAL-NOT-FOUND
        )
      )
    )
  )
)

;; Check if proposal is approved
(define-read-only (is-proposal-approved (property-id uint) (proposal-id uint))
  (if (and (> property-id u0) (> proposal-id u0))
    (match (map-get? proposals {property-id: property-id, proposal-id: proposal-id})
      proposal (ok (get approved proposal))
      (ok false)
    )
    ERR-INVALID-PROPERTY-ID
  )
)

;; Get proposal details
(define-read-only (get-proposal (property-id uint) (proposal-id uint))
  (if (and (> property-id u0) (> proposal-id u0))
    (ok (map-get? proposals {property-id: property-id, proposal-id: proposal-id}))
    ERR-INVALID-PROPERTY-ID
  )
)

;; Get proposal voting stats
(define-read-only (get-proposal-votes (property-id uint) (proposal-id uint))
  (if (and (> property-id u0) (> proposal-id u0))
    (match (map-get? proposals {property-id: property-id, proposal-id: proposal-id})
      proposal (ok {
        votes-for: (get votes-for proposal),
        votes-against: (get votes-against proposal),
        approved: (get approved proposal)
      })
      ERR-PROPOSAL-NOT-FOUND
    )
    ERR-INVALID-PROPERTY-ID
  )
)

;; Check if user has voted
(define-read-only (has-voted (property-id uint) (proposal-id uint) (voter principal))
  (if (and (> property-id u0) (> proposal-id u0))
    (if (not (is-eq voter (as-contract tx-sender)))
      (ok (is-some (map-get? votes {property-id: property-id, proposal-id: proposal-id, voter: voter})))
      ERR-INVALID-VOTER
    )
    ERR-INVALID-PROPERTY-ID
  )
)

;; Get proposal count
(define-read-only (get-proposal-count (property-id uint))
  (if (> property-id u0)
    (ok (default-to u0 
      (get count (map-get? proposal-counts {property-id: property-id}))
    ))
    ERR-INVALID-PROPERTY-ID
  )
)

;; Finalize proposal (owner can manually approve based on votes)
(define-public (finalize-proposal (property-id uint) (proposal-id uint))
  (begin
    (asserts! (> property-id u0) ERR-INVALID-PROPERTY-ID)
    (asserts! (> proposal-id u0) ERR-INVALID-PROPOSAL-ID)
    (asserts! (is-eq tx-sender contract-owner) ERR-NOT-AUTHORIZED)
    
    (match (map-get? proposals {property-id: property-id, proposal-id: proposal-id})
      proposal (begin
        (asserts! (not (get approved proposal)) ERR-ALREADY-APPROVED)
        (asserts! (> (get votes-for proposal) (get votes-against proposal)) ERR-INSUFFICIENT-VOTES)
        
        (map-set proposals 
          {property-id: property-id, proposal-id: proposal-id}
          {
            amount: (get amount proposal),
            description: (get description proposal),
            approved: true,
            proposer: (get proposer proposal),
            votes-for: (get votes-for proposal),
            votes-against: (get votes-against proposal)
          }
        )
        (ok true)
      )
      ERR-PROPOSAL-NOT-FOUND
    )
  )
)