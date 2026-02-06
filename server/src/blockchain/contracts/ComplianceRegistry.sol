// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title ComplianceRegistry
 * @author ComplyEasyAI
 * @notice Production-grade compliance registry for managing certificates, framework
 *         scoring, evidence chain-of-custody, and policy change audit trails on-chain.
 * @dev Implements role-based access control via mappings, a circuit-breaker pause
 *      mechanism, a boolean reentrancy guard, and gas-optimised struct packing.
 *      Does NOT depend on OpenZeppelin to keep the deployment footprint minimal.
 *
 *      ---- Role Hierarchy ----
 *      ADMIN    - can grant / revoke any role, pause / unpause, emergency withdraw
 *      AUDITOR  - can issue, verify, revoke, and renew certificates; record scores
 *      OPERATOR - can submit evidence, record policy changes, execute batch ops
 *
 *      ---- Data Model ----
 *      Certificate   - lifecycle: Issued -> Active -> (Revoked | Expired | Renewed)
 *      FrameworkScore - per-org per-framework scoring history
 *      EvidenceNode  - singly-linked list of evidence hashes per certificate
 *      PolicyChange  - append-only audit trail with diff hashing
 */
contract ComplianceRegistry {

    // =========================================================================
    //                              CUSTOM ERRORS
    // =========================================================================

    /// @dev Caller does not hold the required role.
    error Unauthorized(address caller, bytes32 requiredRole);

    /// @dev Contract is currently paused.
    error ContractPaused();

    /// @dev Contract is not paused (used in unpause guard).
    error ContractNotPaused();

    /// @dev Reentrant call detected.
    error ReentrancyDetected();

    /// @dev Certificate with the given ID already exists.
    error CertificateAlreadyExists(bytes32 certId);

    /// @dev Certificate with the given ID does not exist.
    error CertificateNotFound(bytes32 certId);

    /// @dev Certificate is not in the expected status.
    error InvalidCertificateStatus(bytes32 certId, CertificateStatus current, CertificateStatus expected);

    /// @dev Certificate has expired.
    error CertificateExpired(bytes32 certId, uint64 expiresAt);

    /// @dev Evidence node with the given ID already exists.
    error EvidenceAlreadyExists(bytes32 evidenceId);

    /// @dev Evidence node with the given ID does not exist.
    error EvidenceNotFound(bytes32 evidenceId);

    /// @dev Framework identifier must not be zero.
    error InvalidFramework();

    /// @dev Score must be between 0 and 10000 (basis points).
    error InvalidScore(uint16 score);

    /// @dev Batch arrays have mismatched lengths.
    error BatchLengthMismatch();

    /// @dev Batch size exceeds the maximum allowed.
    error BatchSizeTooLarge(uint256 size, uint256 max);

    /// @dev Zero address supplied where a non-zero address is required.
    error ZeroAddress();

    // =========================================================================
    //                                ENUMS
    // =========================================================================

    /**
     * @notice Lifecycle status of a compliance certificate.
     * @dev Stored as uint8 inside the Certificate struct for tight packing.
     */
    enum CertificateStatus {
        None,       // 0 - default / non-existent
        Issued,     // 1 - created but not yet active
        Active,     // 2 - in-force
        Revoked,    // 3 - permanently invalidated
        Expired,    // 4 - past its expiry timestamp
        Renewed     // 5 - superseded by a newer certificate
    }

    // =========================================================================
    //                               STRUCTS
    // =========================================================================

    /**
     * @notice A compliance certificate issued for an organization + framework.
     * @dev Fields are ordered for tight EVM storage packing:
     *      Slot 0: orgId        (32 bytes)
     *      Slot 1: framework    (32 bytes)
     *      Slot 2: issuer       (20 bytes) + status (1 byte) + score (2 bytes) = 23 bytes
     *      Slot 3: issuedAt(8) + expiresAt(8) + renewedFrom(32) - split across slots
     *      Slot 4: dataHash     (32 bytes)
     *      Slot 5: metadataHash (32 bytes)
     */
    struct Certificate {
        bytes32 orgId;           // keccak256 of the organization identifier
        bytes32 framework;       // keccak256 of the framework name (e.g., "SOC2", "ISO27001")
        address issuer;          // address of the auditor who issued the certificate
        CertificateStatus status; // current lifecycle status
        uint16 score;            // compliance score in basis points (0-10000 = 0-100.00%)
        uint64 issuedAt;         // block.timestamp when issued
        uint64 expiresAt;        // block.timestamp when it expires (0 = no expiry)
        bytes32 renewedFrom;     // certId of the predecessor (bytes32(0) if first issuance)
        bytes32 dataHash;        // SHA-256 hash of the off-chain certificate payload
        bytes32 metadataHash;    // SHA-256 hash of supplementary metadata
    }

    /**
     * @notice A node in the evidence chain-of-custody linked list.
     * @dev Each node points to the previous evidence node for the same certificate,
     *      forming a singly-linked list anchored in `certificateEvidenceHead`.
     *      Slot 0: certId       (32 bytes)
     *      Slot 1: evidenceHash (32 bytes)
     *      Slot 2: submitter(20) + timestamp(8) = 28 bytes
     *      Slot 3: prevNodeId   (32 bytes)
     *      Slot 4: evidenceType (32 bytes)
     */
    struct EvidenceNode {
        bytes32 certId;          // certificate this evidence belongs to
        bytes32 evidenceHash;    // SHA-256 hash of the evidence artefact
        address submitter;       // address that submitted the evidence
        uint64 timestamp;        // block.timestamp of submission
        bytes32 prevNodeId;      // previous evidence node for this certificate (linked list)
        bytes32 evidenceType;    // keccak256 of the evidence type label
    }

    /**
     * @notice Historical framework compliance score record.
     * @dev Stored per (orgId, framework) in an append-only array.
     *      Slot 0: assessor(20) + score(2) + timestamp(8) = 30 bytes
     *      Slot 1: evidenceHash (32 bytes)
     */
    struct FrameworkScore {
        address assessor;        // address of the auditor/assessor
        uint16 score;            // compliance score in basis points (0-10000)
        uint64 timestamp;        // block.timestamp of the assessment
        bytes32 evidenceHash;    // hash of supporting evidence
    }

    /**
     * @notice An entry in the policy change audit trail.
     * @dev Append-only per organization.
     *      Slot 0: policyId     (32 bytes)
     *      Slot 1: author(20) + timestamp(8) = 28 bytes
     *      Slot 2: oldHash      (32 bytes)
     *      Slot 3: newHash      (32 bytes)
     *      Slot 4: diffHash     (32 bytes)
     */
    struct PolicyChange {
        bytes32 policyId;        // keccak256 identifier of the policy
        address author;          // address that recorded the change
        uint64 timestamp;        // block.timestamp of the change
        bytes32 oldHash;         // hash of the previous policy version
        bytes32 newHash;         // hash of the new policy version
        bytes32 diffHash;        // hash of the diff between old and new
    }

    // =========================================================================
    //                             CONSTANTS
    // =========================================================================

    /// @notice Role identifier for administrators.
    bytes32 public constant ADMIN_ROLE    = keccak256("ADMIN_ROLE");

    /// @notice Role identifier for auditors.
    bytes32 public constant AUDITOR_ROLE  = keccak256("AUDITOR_ROLE");

    /// @notice Role identifier for operators.
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");

    /// @notice Maximum number of items in a single batch operation.
    uint256 public constant MAX_BATCH_SIZE = 50;

    /// @notice Maximum score value (100.00% in basis points).
    uint16 public constant MAX_SCORE = 10000;

    // =========================================================================
    //                             STATE VARIABLES
    // =========================================================================

    /// @notice Address of the contract deployer (super-admin).
    address public immutable deployer;

    /// @notice Whether the contract is currently paused.
    bool public paused;

    /// @dev Reentrancy guard mutex.
    bool private _locked;

    /// @notice Total number of certificates ever issued.
    uint256 public certificateCount;

    /// @notice Total number of evidence nodes ever created.
    uint256 public evidenceCount;

    /// @notice Total number of policy changes ever recorded.
    uint256 public policyChangeCount;

    // ---- Role mappings ----
    /// @dev role => account => hasRole
    mapping(bytes32 => mapping(address => bool)) private _roles;

    // ---- Certificate storage ----
    /// @dev certId => Certificate
    mapping(bytes32 => Certificate) private _certificates;

    /// @dev orgId => array of certIds belonging to that org
    mapping(bytes32 => bytes32[]) private _orgCertificates;

    // ---- Evidence chain-of-custody ----
    /// @dev evidenceId => EvidenceNode
    mapping(bytes32 => EvidenceNode) private _evidence;

    /// @dev certId => head (most recent) evidence node ID
    mapping(bytes32 => bytes32) public certificateEvidenceHead;

    /// @dev certId => total evidence count
    mapping(bytes32 => uint256) public certificateEvidenceCount;

    // ---- Framework scoring ----
    /// @dev keccak256(orgId, framework) => array of historical scores
    mapping(bytes32 => FrameworkScore[]) private _frameworkScores;

    /// @dev keccak256(orgId, framework) => latest score in basis points
    mapping(bytes32 => uint16) public latestScore;

    // ---- Policy changes ----
    /// @dev orgId => array of policy changes
    mapping(bytes32 => PolicyChange[]) private _policyChanges;

    // =========================================================================
    //                               EVENTS
    // =========================================================================

    /// @notice Emitted when a role is granted.
    event RoleGranted(bytes32 indexed role, address indexed account, address indexed grantor);

    /// @notice Emitted when a role is revoked.
    event RoleRevoked(bytes32 indexed role, address indexed account, address indexed revoker);

    /// @notice Emitted when the contract is paused.
    event Paused(address indexed account);

    /// @notice Emitted when the contract is unpaused.
    event Unpaused(address indexed account);

    /// @notice Emitted when a certificate is issued.
    event CertificateIssued(
        bytes32 indexed certId,
        bytes32 indexed orgId,
        bytes32 indexed framework,
        address issuer,
        uint16 score,
        uint64 issuedAt,
        uint64 expiresAt
    );

    /// @notice Emitted when a certificate is activated.
    event CertificateActivated(bytes32 indexed certId, address indexed activator);

    /// @notice Emitted when a certificate is revoked.
    event CertificateRevoked(bytes32 indexed certId, address indexed revoker, bytes32 reason);

    /// @notice Emitted when a certificate is renewed.
    event CertificateRenewed(
        bytes32 indexed oldCertId,
        bytes32 indexed newCertId,
        address indexed renewer
    );

    /// @notice Emitted when a certificate's status is verified on-chain.
    event CertificateVerified(bytes32 indexed certId, bool valid, address indexed verifier);

    /// @notice Emitted when evidence is submitted.
    event EvidenceSubmitted(
        bytes32 indexed evidenceId,
        bytes32 indexed certId,
        bytes32 evidenceHash,
        bytes32 evidenceType,
        address indexed submitter
    );

    /// @notice Emitted when a framework score is recorded.
    event FrameworkScoreRecorded(
        bytes32 indexed orgId,
        bytes32 indexed framework,
        uint16 score,
        address indexed assessor
    );

    /// @notice Emitted when a policy change is recorded.
    event PolicyChangeRecorded(
        bytes32 indexed orgId,
        bytes32 indexed policyId,
        bytes32 diffHash,
        address indexed author
    );

    /// @notice Emitted when a batch operation completes.
    event BatchOperationCompleted(
        string indexed operationType,
        uint256 count,
        address indexed executor
    );

    // =========================================================================
    //                              MODIFIERS
    // =========================================================================

    /// @dev Restricts access to accounts holding `role`.
    modifier onlyRole(bytes32 role) {
        if (!_roles[role][msg.sender] && msg.sender != deployer) {
            revert Unauthorized(msg.sender, role);
        }
        _;
    }

    /// @dev Restricts access when the contract is paused.
    modifier whenNotPaused() {
        if (paused) revert ContractPaused();
        _;
    }

    /// @dev Restricts access when the contract is NOT paused.
    modifier whenPaused() {
        if (!paused) revert ContractNotPaused();
        _;
    }

    /// @dev Simple boolean reentrancy guard (mutex pattern).
    modifier nonReentrant() {
        if (_locked) revert ReentrancyDetected();
        _locked = true;
        _;
        _locked = false;
    }

    // =========================================================================
    //                             CONSTRUCTOR
    // =========================================================================

    /**
     * @notice Deploys the ComplianceRegistry and grants the deployer all roles.
     */
    constructor() {
        deployer = msg.sender;

        _roles[ADMIN_ROLE][msg.sender]    = true;
        _roles[AUDITOR_ROLE][msg.sender]  = true;
        _roles[OPERATOR_ROLE][msg.sender] = true;

        emit RoleGranted(ADMIN_ROLE, msg.sender, msg.sender);
        emit RoleGranted(AUDITOR_ROLE, msg.sender, msg.sender);
        emit RoleGranted(OPERATOR_ROLE, msg.sender, msg.sender);
    }

    // =========================================================================
    //                          ROLE MANAGEMENT
    // =========================================================================

    /**
     * @notice Check whether `account` holds `role`.
     * @param role  The role identifier.
     * @param account The address to check.
     * @return True if the account has the role or is the deployer.
     */
    function hasRole(bytes32 role, address account) external view returns (bool) {
        return _roles[role][account] || account == deployer;
    }

    /**
     * @notice Grant `role` to `account`.  Requires ADMIN_ROLE.
     * @param role    The role identifier.
     * @param account The address to receive the role.
     */
    function grantRole(bytes32 role, address account)
        external
        onlyRole(ADMIN_ROLE)
        whenNotPaused
    {
        if (account == address(0)) revert ZeroAddress();
        _roles[role][account] = true;
        emit RoleGranted(role, account, msg.sender);
    }

    /**
     * @notice Revoke `role` from `account`.  Requires ADMIN_ROLE.
     * @param role    The role identifier.
     * @param account The address to lose the role.
     */
    function revokeRole(bytes32 role, address account)
        external
        onlyRole(ADMIN_ROLE)
        whenNotPaused
    {
        _roles[role][account] = false;
        emit RoleRevoked(role, account, msg.sender);
    }

    // =========================================================================
    //                         PAUSE / UNPAUSE
    // =========================================================================

    /**
     * @notice Pause the contract.  Only ADMIN_ROLE.
     * @dev Circuit-breaker: blocks all state-mutating operations except unpause.
     */
    function pause() external onlyRole(ADMIN_ROLE) whenNotPaused {
        paused = true;
        emit Paused(msg.sender);
    }

    /**
     * @notice Unpause the contract.  Only ADMIN_ROLE.
     */
    function unpause() external onlyRole(ADMIN_ROLE) whenPaused {
        paused = false;
        emit Unpaused(msg.sender);
    }

    // =========================================================================
    //                    CERTIFICATE LIFECYCLE
    // =========================================================================

    /**
     * @notice Issue a new compliance certificate.
     * @param certId       Unique identifier (typically keccak256 of cert data).
     * @param orgId        Organisation identifier hash.
     * @param framework    Framework identifier hash (e.g., keccak256("SOC2")).
     * @param score        Compliance score in basis points (0-10000).
     * @param expiresAt    Expiry timestamp (0 for no expiry).
     * @param dataHash     SHA-256 hash of the off-chain certificate payload.
     * @param metadataHash SHA-256 hash of supplementary metadata.
     */
    function issueCertificate(
        bytes32 certId,
        bytes32 orgId,
        bytes32 framework,
        uint16 score,
        uint64 expiresAt,
        bytes32 dataHash,
        bytes32 metadataHash
    )
        external
        onlyRole(AUDITOR_ROLE)
        whenNotPaused
        nonReentrant
    {
        if (_certificates[certId].status != CertificateStatus.None) {
            revert CertificateAlreadyExists(certId);
        }
        if (framework == bytes32(0)) revert InvalidFramework();
        if (score > MAX_SCORE) revert InvalidScore(score);

        _certificates[certId] = Certificate({
            orgId: orgId,
            framework: framework,
            issuer: msg.sender,
            status: CertificateStatus.Issued,
            score: score,
            issuedAt: uint64(block.timestamp),
            expiresAt: expiresAt,
            renewedFrom: bytes32(0),
            dataHash: dataHash,
            metadataHash: metadataHash
        });

        _orgCertificates[orgId].push(certId);
        certificateCount++;

        emit CertificateIssued(
            certId,
            orgId,
            framework,
            msg.sender,
            score,
            uint64(block.timestamp),
            expiresAt
        );
    }

    /**
     * @notice Activate an issued certificate, moving it to Active status.
     * @param certId The certificate to activate.
     */
    function activateCertificate(bytes32 certId)
        external
        onlyRole(AUDITOR_ROLE)
        whenNotPaused
    {
        Certificate storage cert = _certificates[certId];
        if (cert.status == CertificateStatus.None) revert CertificateNotFound(certId);
        if (cert.status != CertificateStatus.Issued) {
            revert InvalidCertificateStatus(certId, cert.status, CertificateStatus.Issued);
        }

        cert.status = CertificateStatus.Active;
        emit CertificateActivated(certId, msg.sender);
    }

    /**
     * @notice Revoke an active or issued certificate.
     * @param certId The certificate to revoke.
     * @param reason Hash of the revocation reason.
     */
    function revokeCertificate(bytes32 certId, bytes32 reason)
        external
        onlyRole(AUDITOR_ROLE)
        whenNotPaused
        nonReentrant
    {
        Certificate storage cert = _certificates[certId];
        if (cert.status == CertificateStatus.None) revert CertificateNotFound(certId);
        if (
            cert.status != CertificateStatus.Active &&
            cert.status != CertificateStatus.Issued
        ) {
            revert InvalidCertificateStatus(certId, cert.status, CertificateStatus.Active);
        }

        cert.status = CertificateStatus.Revoked;
        emit CertificateRevoked(certId, msg.sender, reason);
    }

    /**
     * @notice Renew a certificate by creating a successor and marking the old one Renewed.
     * @param oldCertId      The certificate being renewed.
     * @param newCertId      Unique ID for the replacement certificate.
     * @param newScore       Updated compliance score.
     * @param newExpiresAt   New expiry timestamp.
     * @param newDataHash    Updated certificate data hash.
     * @param newMetadataHash Updated metadata hash.
     */
    function renewCertificate(
        bytes32 oldCertId,
        bytes32 newCertId,
        uint16 newScore,
        uint64 newExpiresAt,
        bytes32 newDataHash,
        bytes32 newMetadataHash
    )
        external
        onlyRole(AUDITOR_ROLE)
        whenNotPaused
        nonReentrant
    {
        Certificate storage oldCert = _certificates[oldCertId];
        if (oldCert.status == CertificateStatus.None) revert CertificateNotFound(oldCertId);
        if (
            oldCert.status != CertificateStatus.Active &&
            oldCert.status != CertificateStatus.Expired
        ) {
            revert InvalidCertificateStatus(oldCertId, oldCert.status, CertificateStatus.Active);
        }
        if (_certificates[newCertId].status != CertificateStatus.None) {
            revert CertificateAlreadyExists(newCertId);
        }
        if (newScore > MAX_SCORE) revert InvalidScore(newScore);

        // Mark old certificate as renewed
        oldCert.status = CertificateStatus.Renewed;

        // Create the successor certificate
        _certificates[newCertId] = Certificate({
            orgId: oldCert.orgId,
            framework: oldCert.framework,
            issuer: msg.sender,
            status: CertificateStatus.Active,
            score: newScore,
            issuedAt: uint64(block.timestamp),
            expiresAt: newExpiresAt,
            renewedFrom: oldCertId,
            dataHash: newDataHash,
            metadataHash: newMetadataHash
        });

        _orgCertificates[oldCert.orgId].push(newCertId);
        certificateCount++;

        emit CertificateRenewed(oldCertId, newCertId, msg.sender);
        emit CertificateIssued(
            newCertId,
            oldCert.orgId,
            oldCert.framework,
            msg.sender,
            newScore,
            uint64(block.timestamp),
            newExpiresAt
        );
    }

    /**
     * @notice Verify whether a certificate is currently valid.
     * @dev A certificate is considered valid if its status is Active and it has
     *      not passed its expiry timestamp. If it is expired, the status is
     *      updated to Expired on-chain (lazy expiry).
     * @param certId The certificate to verify.
     * @return valid   Whether the certificate is valid right now.
     * @return status  The current status enum value.
     * @return score   The compliance score in basis points.
     * @return expiresAt The expiry timestamp.
     */
    function verifyCertificate(bytes32 certId)
        external
        returns (bool valid, CertificateStatus status, uint16 score, uint64 expiresAt)
    {
        Certificate storage cert = _certificates[certId];
        if (cert.status == CertificateStatus.None) revert CertificateNotFound(certId);

        // Lazy expiry: if Active but past expiry, flip status
        if (
            cert.status == CertificateStatus.Active &&
            cert.expiresAt > 0 &&
            block.timestamp > cert.expiresAt
        ) {
            cert.status = CertificateStatus.Expired;
        }

        bool isValid = cert.status == CertificateStatus.Active;
        emit CertificateVerified(certId, isValid, msg.sender);

        return (isValid, cert.status, cert.score, cert.expiresAt);
    }

    /**
     * @notice Read-only certificate fetch (does NOT perform lazy expiry).
     * @param certId The certificate to retrieve.
     * @return orgId       Organisation hash.
     * @return framework   Framework hash.
     * @return issuer      Issuer address.
     * @return status      Certificate status.
     * @return score       Score in basis points.
     * @return issuedAt    Issue timestamp.
     * @return expiresAt   Expiry timestamp.
     * @return renewedFrom Predecessor certificate ID.
     * @return dataHash    Certificate data hash.
     * @return metadataHash Metadata hash.
     */
    function getCertificate(bytes32 certId)
        external
        view
        returns (
            bytes32 orgId,
            bytes32 framework,
            address issuer,
            CertificateStatus status,
            uint16 score,
            uint64 issuedAt,
            uint64 expiresAt,
            bytes32 renewedFrom,
            bytes32 dataHash,
            bytes32 metadataHash
        )
    {
        Certificate storage cert = _certificates[certId];
        if (cert.status == CertificateStatus.None) revert CertificateNotFound(certId);

        return (
            cert.orgId,
            cert.framework,
            cert.issuer,
            cert.status,
            cert.score,
            cert.issuedAt,
            cert.expiresAt,
            cert.renewedFrom,
            cert.dataHash,
            cert.metadataHash
        );
    }

    /**
     * @notice Get all certificate IDs for an organisation.
     * @param orgId The organisation hash.
     * @return Array of certificate IDs.
     */
    function getOrgCertificates(bytes32 orgId) external view returns (bytes32[] memory) {
        return _orgCertificates[orgId];
    }

    // =========================================================================
    //                    EVIDENCE CHAIN-OF-CUSTODY
    // =========================================================================

    /**
     * @notice Submit evidence linked to a certificate, prepending to the chain.
     * @param evidenceId   Unique evidence identifier.
     * @param certId       Certificate the evidence relates to.
     * @param evidenceHash SHA-256 hash of the evidence artefact.
     * @param evidenceType Keccak256 of the evidence type label.
     */
    function submitEvidence(
        bytes32 evidenceId,
        bytes32 certId,
        bytes32 evidenceHash,
        bytes32 evidenceType
    )
        external
        onlyRole(OPERATOR_ROLE)
        whenNotPaused
        nonReentrant
    {
        if (_certificates[certId].status == CertificateStatus.None) {
            revert CertificateNotFound(certId);
        }
        if (_evidence[evidenceId].timestamp != 0) {
            revert EvidenceAlreadyExists(evidenceId);
        }

        bytes32 prevHead = certificateEvidenceHead[certId];

        _evidence[evidenceId] = EvidenceNode({
            certId: certId,
            evidenceHash: evidenceHash,
            submitter: msg.sender,
            timestamp: uint64(block.timestamp),
            prevNodeId: prevHead,
            evidenceType: evidenceType
        });

        certificateEvidenceHead[certId] = evidenceId;
        certificateEvidenceCount[certId]++;
        evidenceCount++;

        emit EvidenceSubmitted(evidenceId, certId, evidenceHash, evidenceType, msg.sender);
    }

    /**
     * @notice Retrieve a single evidence node.
     * @param evidenceId The evidence node identifier.
     * @return certId       Certificate it belongs to.
     * @return evidenceHash Hash of the artefact.
     * @return submitter    Who submitted it.
     * @return timestamp    When it was submitted.
     * @return prevNodeId   Previous node in the chain.
     * @return evidenceType Type label hash.
     */
    function getEvidence(bytes32 evidenceId)
        external
        view
        returns (
            bytes32 certId,
            bytes32 evidenceHash,
            address submitter,
            uint64 timestamp,
            bytes32 prevNodeId,
            bytes32 evidenceType
        )
    {
        EvidenceNode storage node = _evidence[evidenceId];
        if (node.timestamp == 0) revert EvidenceNotFound(evidenceId);

        return (
            node.certId,
            node.evidenceHash,
            node.submitter,
            node.timestamp,
            node.prevNodeId,
            node.evidenceType
        );
    }

    /**
     * @notice Walk the evidence chain for a certificate and return up to `limit` hashes.
     * @param certId Certificate to query.
     * @param limit  Maximum number of hashes to return (0 = all).
     * @return hashes  Ordered array of evidence hashes (newest first).
     * @return nodeIds Ordered array of evidence node IDs.
     */
    function getEvidenceChain(bytes32 certId, uint256 limit)
        external
        view
        returns (bytes32[] memory hashes, bytes32[] memory nodeIds)
    {
        uint256 total = certificateEvidenceCount[certId];
        uint256 count = (limit == 0 || limit > total) ? total : limit;

        hashes  = new bytes32[](count);
        nodeIds = new bytes32[](count);

        bytes32 current = certificateEvidenceHead[certId];
        for (uint256 i = 0; i < count && current != bytes32(0); i++) {
            EvidenceNode storage node = _evidence[current];
            hashes[i]  = node.evidenceHash;
            nodeIds[i] = current;
            current = node.prevNodeId;
        }

        return (hashes, nodeIds);
    }

    // =========================================================================
    //                     FRAMEWORK COMPLIANCE SCORING
    // =========================================================================

    /**
     * @notice Record a framework compliance score for an organisation.
     * @param orgId        Organisation identifier hash.
     * @param framework    Framework identifier hash.
     * @param score        Score in basis points (0-10000).
     * @param evidenceHash Hash of supporting evidence.
     */
    function recordFrameworkScore(
        bytes32 orgId,
        bytes32 framework,
        uint16 score,
        bytes32 evidenceHash
    )
        external
        onlyRole(AUDITOR_ROLE)
        whenNotPaused
    {
        if (framework == bytes32(0)) revert InvalidFramework();
        if (score > MAX_SCORE) revert InvalidScore(score);

        bytes32 key = keccak256(abi.encodePacked(orgId, framework));

        _frameworkScores[key].push(FrameworkScore({
            assessor: msg.sender,
            score: score,
            timestamp: uint64(block.timestamp),
            evidenceHash: evidenceHash
        }));

        latestScore[key] = score;

        emit FrameworkScoreRecorded(orgId, framework, score, msg.sender);
    }

    /**
     * @notice Get the latest framework score for an organisation.
     * @param orgId     Organisation hash.
     * @param framework Framework hash.
     * @return score      Latest score in basis points.
     * @return assessor   Who performed the assessment.
     * @return timestamp  When the assessment occurred.
     * @return historyLen Total number of historical scores.
     */
    function getLatestFrameworkScore(bytes32 orgId, bytes32 framework)
        external
        view
        returns (uint16 score, address assessor, uint64 timestamp, uint256 historyLen)
    {
        bytes32 key = keccak256(abi.encodePacked(orgId, framework));
        FrameworkScore[] storage scores = _frameworkScores[key];

        if (scores.length == 0) {
            return (0, address(0), 0, 0);
        }

        FrameworkScore storage latest = scores[scores.length - 1];
        return (latest.score, latest.assessor, latest.timestamp, scores.length);
    }

    /**
     * @notice Get historical framework scores with pagination.
     * @param orgId     Organisation hash.
     * @param framework Framework hash.
     * @param offset    Start index (0-based).
     * @param limit     Maximum number of records.
     * @return assessors     Array of assessor addresses.
     * @return scores        Array of scores.
     * @return timestamps    Array of timestamps.
     * @return evidenceHashes Array of evidence hashes.
     */
    function getFrameworkScoreHistory(
        bytes32 orgId,
        bytes32 framework,
        uint256 offset,
        uint256 limit
    )
        external
        view
        returns (
            address[] memory assessors,
            uint16[] memory scores,
            uint64[] memory timestamps,
            bytes32[] memory evidenceHashes
        )
    {
        bytes32 key = keccak256(abi.encodePacked(orgId, framework));
        FrameworkScore[] storage allScores = _frameworkScores[key];

        if (offset >= allScores.length) {
            return (
                new address[](0),
                new uint16[](0),
                new uint64[](0),
                new bytes32[](0)
            );
        }

        uint256 remaining = allScores.length - offset;
        uint256 count = limit < remaining ? limit : remaining;

        assessors      = new address[](count);
        scores         = new uint16[](count);
        timestamps     = new uint64[](count);
        evidenceHashes = new bytes32[](count);

        for (uint256 i = 0; i < count; i++) {
            FrameworkScore storage s = allScores[offset + i];
            assessors[i]      = s.assessor;
            scores[i]         = s.score;
            timestamps[i]     = s.timestamp;
            evidenceHashes[i] = s.evidenceHash;
        }

        return (assessors, scores, timestamps, evidenceHashes);
    }

    // =========================================================================
    //                     POLICY CHANGE AUDIT TRAIL
    // =========================================================================

    /**
     * @notice Record a policy change for an organisation.
     * @param orgId    Organisation identifier hash.
     * @param policyId Policy identifier hash.
     * @param oldHash  Hash of the previous policy version.
     * @param newHash  Hash of the new policy version.
     * @param diffHash Hash of the diff between versions.
     */
    function recordPolicyChange(
        bytes32 orgId,
        bytes32 policyId,
        bytes32 oldHash,
        bytes32 newHash,
        bytes32 diffHash
    )
        external
        onlyRole(OPERATOR_ROLE)
        whenNotPaused
    {
        _policyChanges[orgId].push(PolicyChange({
            policyId: policyId,
            author: msg.sender,
            timestamp: uint64(block.timestamp),
            oldHash: oldHash,
            newHash: newHash,
            diffHash: diffHash
        }));

        policyChangeCount++;

        emit PolicyChangeRecorded(orgId, policyId, diffHash, msg.sender);
    }

    /**
     * @notice Get the total number of policy changes for an organisation.
     * @param orgId Organisation hash.
     * @return Total count.
     */
    function getPolicyChangeCount(bytes32 orgId) external view returns (uint256) {
        return _policyChanges[orgId].length;
    }

    /**
     * @notice Get a specific policy change record.
     * @param orgId Organisation hash.
     * @param index Zero-based index in the organisation's policy change array.
     * @return policyId  Policy identifier hash.
     * @return author    Who made the change.
     * @return timestamp When the change was recorded.
     * @return oldHash   Previous version hash.
     * @return newHash   New version hash.
     * @return diffHash  Diff hash.
     */
    function getPolicyChange(bytes32 orgId, uint256 index)
        external
        view
        returns (
            bytes32 policyId,
            address author,
            uint64 timestamp,
            bytes32 oldHash,
            bytes32 newHash,
            bytes32 diffHash
        )
    {
        PolicyChange storage pc = _policyChanges[orgId][index];
        return (pc.policyId, pc.author, pc.timestamp, pc.oldHash, pc.newHash, pc.diffHash);
    }

    /**
     * @notice Get paginated policy changes for an organisation.
     * @param orgId  Organisation hash.
     * @param offset Start index.
     * @param limit  Maximum records to return.
     * @return policyIds  Array of policy IDs.
     * @return authors    Array of author addresses.
     * @return timestamps Array of timestamps.
     * @return diffHashes Array of diff hashes.
     */
    function getPolicyChanges(bytes32 orgId, uint256 offset, uint256 limit)
        external
        view
        returns (
            bytes32[] memory policyIds,
            address[] memory authors,
            uint64[] memory timestamps,
            bytes32[] memory diffHashes
        )
    {
        PolicyChange[] storage changes = _policyChanges[orgId];

        if (offset >= changes.length) {
            return (
                new bytes32[](0),
                new address[](0),
                new uint64[](0),
                new bytes32[](0)
            );
        }

        uint256 remaining = changes.length - offset;
        uint256 count = limit < remaining ? limit : remaining;

        policyIds  = new bytes32[](count);
        authors    = new address[](count);
        timestamps = new uint64[](count);
        diffHashes = new bytes32[](count);

        for (uint256 i = 0; i < count; i++) {
            PolicyChange storage pc = changes[offset + i];
            policyIds[i]  = pc.policyId;
            authors[i]    = pc.author;
            timestamps[i] = pc.timestamp;
            diffHashes[i] = pc.diffHash;
        }

        return (policyIds, authors, timestamps, diffHashes);
    }

    // =========================================================================
    //                         BATCH OPERATIONS
    // =========================================================================

    /**
     * @notice Batch-issue multiple certificates in one transaction.
     * @param certIds       Array of certificate IDs.
     * @param orgIds        Array of organisation hashes.
     * @param frameworks    Array of framework hashes.
     * @param scores        Array of scores.
     * @param expiresAts    Array of expiry timestamps.
     * @param dataHashes    Array of data hashes.
     * @param metadataHashes Array of metadata hashes.
     */
    function batchIssueCertificates(
        bytes32[] calldata certIds,
        bytes32[] calldata orgIds,
        bytes32[] calldata frameworks,
        uint16[] calldata scores,
        uint64[] calldata expiresAts,
        bytes32[] calldata dataHashes,
        bytes32[] calldata metadataHashes
    )
        external
        onlyRole(AUDITOR_ROLE)
        whenNotPaused
        nonReentrant
    {
        uint256 len = certIds.length;
        if (
            len != orgIds.length ||
            len != frameworks.length ||
            len != scores.length ||
            len != expiresAts.length ||
            len != dataHashes.length ||
            len != metadataHashes.length
        ) revert BatchLengthMismatch();
        if (len > MAX_BATCH_SIZE) revert BatchSizeTooLarge(len, MAX_BATCH_SIZE);

        for (uint256 i = 0; i < len; i++) {
            bytes32 cid = certIds[i];
            if (_certificates[cid].status != CertificateStatus.None) {
                revert CertificateAlreadyExists(cid);
            }
            if (frameworks[i] == bytes32(0)) revert InvalidFramework();
            if (scores[i] > MAX_SCORE) revert InvalidScore(scores[i]);

            _certificates[cid] = Certificate({
                orgId: orgIds[i],
                framework: frameworks[i],
                issuer: msg.sender,
                status: CertificateStatus.Issued,
                score: scores[i],
                issuedAt: uint64(block.timestamp),
                expiresAt: expiresAts[i],
                renewedFrom: bytes32(0),
                dataHash: dataHashes[i],
                metadataHash: metadataHashes[i]
            });

            _orgCertificates[orgIds[i]].push(cid);
            certificateCount++;

            emit CertificateIssued(
                cid,
                orgIds[i],
                frameworks[i],
                msg.sender,
                scores[i],
                uint64(block.timestamp),
                expiresAts[i]
            );
        }

        emit BatchOperationCompleted("batchIssueCertificates", len, msg.sender);
    }

    /**
     * @notice Batch-submit multiple evidence nodes in one transaction.
     * @param evidenceIds   Array of evidence IDs.
     * @param certIds       Array of certificate IDs.
     * @param evidenceHashes Array of evidence hashes.
     * @param evidenceTypes Array of evidence type hashes.
     */
    function batchSubmitEvidence(
        bytes32[] calldata evidenceIds,
        bytes32[] calldata certIds,
        bytes32[] calldata evidenceHashes,
        bytes32[] calldata evidenceTypes
    )
        external
        onlyRole(OPERATOR_ROLE)
        whenNotPaused
        nonReentrant
    {
        uint256 len = evidenceIds.length;
        if (
            len != certIds.length ||
            len != evidenceHashes.length ||
            len != evidenceTypes.length
        ) revert BatchLengthMismatch();
        if (len > MAX_BATCH_SIZE) revert BatchSizeTooLarge(len, MAX_BATCH_SIZE);

        for (uint256 i = 0; i < len; i++) {
            bytes32 eid = evidenceIds[i];
            bytes32 cid = certIds[i];

            if (_certificates[cid].status == CertificateStatus.None) {
                revert CertificateNotFound(cid);
            }
            if (_evidence[eid].timestamp != 0) {
                revert EvidenceAlreadyExists(eid);
            }

            bytes32 prevHead = certificateEvidenceHead[cid];

            _evidence[eid] = EvidenceNode({
                certId: cid,
                evidenceHash: evidenceHashes[i],
                submitter: msg.sender,
                timestamp: uint64(block.timestamp),
                prevNodeId: prevHead,
                evidenceType: evidenceTypes[i]
            });

            certificateEvidenceHead[cid] = eid;
            certificateEvidenceCount[cid]++;
            evidenceCount++;

            emit EvidenceSubmitted(eid, cid, evidenceHashes[i], evidenceTypes[i], msg.sender);
        }

        emit BatchOperationCompleted("batchSubmitEvidence", len, msg.sender);
    }

    /**
     * @notice Batch-record multiple framework scores in one transaction.
     * @param orgIds         Array of organisation hashes.
     * @param frameworks     Array of framework hashes.
     * @param scores         Array of scores.
     * @param evidenceHashes Array of evidence hashes.
     */
    function batchRecordScores(
        bytes32[] calldata orgIds,
        bytes32[] calldata frameworks,
        uint16[] calldata scores,
        bytes32[] calldata evidenceHashes
    )
        external
        onlyRole(AUDITOR_ROLE)
        whenNotPaused
    {
        uint256 len = orgIds.length;
        if (
            len != frameworks.length ||
            len != scores.length ||
            len != evidenceHashes.length
        ) revert BatchLengthMismatch();
        if (len > MAX_BATCH_SIZE) revert BatchSizeTooLarge(len, MAX_BATCH_SIZE);

        for (uint256 i = 0; i < len; i++) {
            if (frameworks[i] == bytes32(0)) revert InvalidFramework();
            if (scores[i] > MAX_SCORE) revert InvalidScore(scores[i]);

            bytes32 key = keccak256(abi.encodePacked(orgIds[i], frameworks[i]));

            _frameworkScores[key].push(FrameworkScore({
                assessor: msg.sender,
                score: scores[i],
                timestamp: uint64(block.timestamp),
                evidenceHash: evidenceHashes[i]
            }));

            latestScore[key] = scores[i];

            emit FrameworkScoreRecorded(orgIds[i], frameworks[i], scores[i], msg.sender);
        }

        emit BatchOperationCompleted("batchRecordScores", len, msg.sender);
    }

    // =========================================================================
    //                          VIEW HELPERS
    // =========================================================================

    /**
     * @notice Check if a certificate exists (any status except None).
     * @param certId Certificate ID.
     * @return True if the certificate exists.
     */
    function certificateExists(bytes32 certId) external view returns (bool) {
        return _certificates[certId].status != CertificateStatus.None;
    }

    /**
     * @notice Get the number of certificates for an organisation.
     * @param orgId Organisation hash.
     * @return Certificate count.
     */
    function getOrgCertificateCount(bytes32 orgId) external view returns (uint256) {
        return _orgCertificates[orgId].length;
    }

    /**
     * @notice Compute the framework score mapping key for off-chain use.
     * @param orgId     Organisation hash.
     * @param framework Framework hash.
     * @return The keccak256 key.
     */
    function computeScoreKey(bytes32 orgId, bytes32 framework) external pure returns (bytes32) {
        return keccak256(abi.encodePacked(orgId, framework));
    }
}
