// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title ComplianceAuditLog
 * @dev Immutable audit log for compliance events on blockchain
 * @notice This contract stores compliance audit events in an immutable ledger
 */
contract ComplianceAuditLog {
    // Event emitted when an audit entry is created
    event AuditLogCreated(
        bytes32 indexed logId,
        string indexed organizationId,
        string action,
        bytes32 dataHash,
        uint256 timestamp
    );

    // Event emitted when evidence is stored
    event EvidenceStored(
        bytes32 indexed evidenceId,
        bytes32 indexed logId,
        bytes32 evidenceHash,
        uint256 timestamp
    );

    // Audit log entry structure
    struct AuditEntry {
        bytes32 logId;
        string organizationId;
        string userId;
        string action;
        bytes32 dataHash; // SHA-256 hash of the audit data
        uint256 timestamp;
        bool exists;
    }

    // Evidence entry structure
    struct Evidence {
        bytes32 evidenceId;
        bytes32 logId;
        bytes32 evidenceHash; // SHA-256 hash of the evidence
        uint256 timestamp;
        bool exists;
    }

    // Mapping of log ID to audit entry
    mapping(bytes32 => AuditEntry) public auditLogs;

    // Mapping of evidence ID to evidence
    mapping(bytes32 => Evidence) public evidences;

    // Mapping to track log IDs by organization
    mapping(string => bytes32[]) private organizationLogs;

    // Contract owner
    address public owner;

    // Authorized writers (backend services)
    mapping(address => bool) public authorizedWriters;

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }

    modifier onlyAuthorized() {
        require(
            msg.sender == owner || authorizedWriters[msg.sender],
            "Not authorized to write"
        );
        _;
    }

    constructor() {
        owner = msg.sender;
        authorizedWriters[msg.sender] = true;
    }

    /**
     * @dev Add an authorized writer address
     * @param writer Address to authorize
     */
    function addAuthorizedWriter(address writer) external onlyOwner {
        authorizedWriters[writer] = true;
    }

    /**
     * @dev Remove an authorized writer address
     * @param writer Address to deauthorize
     */
    function removeAuthorizedWriter(address writer) external onlyOwner {
        authorizedWriters[writer] = false;
    }

    /**
     * @dev Create an audit log entry
     * @param logId Unique identifier for the log entry
     * @param organizationId Organization ID
     * @param userId User ID who performed the action
     * @param action Action performed
     * @param dataHash SHA-256 hash of the audit data
     */
    function createAuditLog(
        bytes32 logId,
        string memory organizationId,
        string memory userId,
        string memory action,
        bytes32 dataHash
    ) external onlyAuthorized {
        require(!auditLogs[logId].exists, "Audit log already exists");

        auditLogs[logId] = AuditEntry({
            logId: logId,
            organizationId: organizationId,
            userId: userId,
            action: action,
            dataHash: dataHash,
            timestamp: block.timestamp,
            exists: true
        });

        organizationLogs[organizationId].push(logId);

        emit AuditLogCreated(
            logId,
            organizationId,
            action,
            dataHash,
            block.timestamp
        );
    }

    /**
     * @dev Store evidence hash linked to an audit log
     * @param evidenceId Unique identifier for the evidence
     * @param logId Associated audit log ID
     * @param evidenceHash SHA-256 hash of the evidence
     */
    function storeEvidence(
        bytes32 evidenceId,
        bytes32 logId,
        bytes32 evidenceHash
    ) external onlyAuthorized {
        require(auditLogs[logId].exists, "Audit log does not exist");
        require(!evidences[evidenceId].exists, "Evidence already exists");

        evidences[evidenceId] = Evidence({
            evidenceId: evidenceId,
            logId: logId,
            evidenceHash: evidenceHash,
            timestamp: block.timestamp,
            exists: true
        });

        emit EvidenceStored(
            evidenceId,
            logId,
            evidenceHash,
            block.timestamp
        );
    }

    /**
     * @dev Get audit log by ID
     * @param logId Log ID to retrieve
     * @return Audit entry details
     */
    function getAuditLog(bytes32 logId)
        external
        view
        returns (
            string memory organizationId,
            string memory userId,
            string memory action,
            bytes32 dataHash,
            uint256 timestamp
        )
    {
        require(auditLogs[logId].exists, "Audit log does not exist");
        AuditEntry memory entry = auditLogs[logId];
        return (
            entry.organizationId,
            entry.userId,
            entry.action,
            entry.dataHash,
            entry.timestamp
        );
    }

    /**
     * @dev Get evidence by ID
     * @param evidenceId Evidence ID to retrieve
     * @return Evidence details
     */
    function getEvidence(bytes32 evidenceId)
        external
        view
        returns (
            bytes32 logId,
            bytes32 evidenceHash,
            uint256 timestamp
        )
    {
        require(evidences[evidenceId].exists, "Evidence does not exist");
        Evidence memory evidence = evidences[evidenceId];
        return (evidence.logId, evidence.evidenceHash, evidence.timestamp);
    }

    /**
     * @dev Get all log IDs for an organization
     * @param organizationId Organization ID
     * @return Array of log IDs
     */
    function getOrganizationLogs(string memory organizationId)
        external
        view
        returns (bytes32[] memory)
    {
        return organizationLogs[organizationId];
    }

    /**
     * @dev Verify data hash against stored audit log
     * @param logId Log ID to verify
     * @param dataHash Hash to verify
     * @return True if hash matches
     */
    function verifyAuditLog(bytes32 logId, bytes32 dataHash)
        external
        view
        returns (bool)
    {
        require(auditLogs[logId].exists, "Audit log does not exist");
        return auditLogs[logId].dataHash == dataHash;
    }

    /**
     * @dev Verify evidence hash against stored evidence
     * @param evidenceId Evidence ID to verify
     * @param evidenceHash Hash to verify
     * @return True if hash matches
     */
    function verifyEvidence(bytes32 evidenceId, bytes32 evidenceHash)
        external
        view
        returns (bool)
    {
        require(evidences[evidenceId].exists, "Evidence does not exist");
        return evidences[evidenceId].evidenceHash == evidenceHash;
    }
}
