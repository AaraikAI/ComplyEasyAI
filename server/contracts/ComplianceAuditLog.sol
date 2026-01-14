// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title ComplianceAuditLog
 * @notice Smart contract for storing compliance audit logs on blockchain
 * @dev Production-ready Solidity contract for ComplyEasyAI
 */
contract ComplianceAuditLog {
    struct AuditEntry {
        bytes32 hash;
        string organizationId;
        string action;
        uint256 timestamp;
        address submittedBy;
        bool verified;
    }
    
    mapping(bytes32 => AuditEntry) public auditLogs;
    mapping(string => bytes32[]) public organizationLogs;
    
    address public owner;
    uint256 public totalEntries;
    
    event AuditLogSubmitted(
        bytes32 indexed hash,
        string indexed organizationId,
        string action,
        uint256 timestamp,
        address submittedBy
    );
    
    event AuditLogVerified(
        bytes32 indexed hash,
        bool verified
    );
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }
    
    constructor() {
        owner = msg.sender;
    }
    
    /**
     * @notice Submit an audit log entry
     * @param hash SHA-256 hash of the audit log data
     * @param organizationId Organization identifier
     * @param action Action type (e.g., "control.updated", "risk.created")
     */
    function submitAuditLog(
        bytes32 hash,
        string memory organizationId,
        string memory action
    ) public {
        require(auditLogs[hash].timestamp == 0, "Audit log already exists");
        
        AuditEntry memory entry = AuditEntry({
            hash: hash,
            organizationId: organizationId,
            action: action,
            timestamp: block.timestamp,
            submittedBy: msg.sender,
            verified: false
        });
        
        auditLogs[hash] = entry;
        organizationLogs[organizationId].push(hash);
        totalEntries++;
        
        emit AuditLogSubmitted(
            hash,
            organizationId,
            action,
            block.timestamp,
            msg.sender
        );
    }
    
    /**
     * @notice Verify an audit log entry
     * @param hash Hash of the audit log to verify
     */
    function verifyAuditLog(bytes32 hash) public onlyOwner {
        require(auditLogs[hash].timestamp != 0, "Audit log does not exist");
        require(!auditLogs[hash].verified, "Audit log already verified");
        
        auditLogs[hash].verified = true;
        
        emit AuditLogVerified(hash, true);
    }
    
    /**
     * @notice Get audit log entry
     * @param hash Hash of the audit log
     * @return entry Audit log entry
     */
    function getAuditLog(bytes32 hash) public view returns (AuditEntry memory) {
        require(auditLogs[hash].timestamp != 0, "Audit log does not exist");
        return auditLogs[hash];
    }
    
    /**
     * @notice Get all audit log hashes for an organization
     * @param organizationId Organization identifier
     * @return hashes Array of audit log hashes
     */
    function getOrganizationLogs(string memory organizationId) public view returns (bytes32[] memory) {
        return organizationLogs[organizationId];
    }
    
    /**
     * @notice Get total number of entries
     * @return count Total entries
     */
    function getTotalEntries() public view returns (uint256) {
        return totalEntries;
    }
}

