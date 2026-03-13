// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract TransparentService {
    // Status now includes Verified to represent admin verification
    enum Status { Pending, InProgress, Verified, Completed }

    struct ServiceRequest {
        uint256 id;
        address citizen;
        string serviceType;
        Status status;
        uint256 timestamp;
        string userDoc;      // URI or hash of user's uploaded JPG
        string adminDoc;     // URI or hash of admin's uploaded verification document
        uint256 verifiedTimestamp;
    }

    // Main admin (single) who can verify officers
    address public mainAdmin;

    struct Officer {
        bool registered;
        bool verified;
        uint256 registeredAt;
        uint256 verifiedAt;
    }

    // track officers and a list for enumeration
    mapping(address => Officer) public officers;
    address[] public officerList;

    uint256 public requestCount;
    ServiceRequest[] public requests;

    event RequestCreated(uint256 id, address citizen, string serviceType, string userDoc);
    event UserDocumentUploaded(uint256 id, address citizen, string userDoc);
    event AdminDocumentUploaded(uint256 id, address officer, string adminDoc);
    event RequestVerified(uint256 id, address officer, uint256 timestamp);
    event StatusUpdated(uint256 id, Status status);
    event OfficerRegistered(address officer, uint256 timestamp);
    event OfficerVerified(address officer, bool approved, uint256 timestamp);

    modifier onlyOfficer() {
        require(officers[msg.sender].verified, "Only verified officer");
        _;
    }

    modifier onlyCitizen(uint256 _id) {
        require(_id < requests.length, "Invalid id");
        require(msg.sender == requests[_id].citizen, "Only citizen owner");
        _;
    }

    modifier onlyMainAdmin() {
        require(msg.sender == mainAdmin, "Only main admin");
        _;
    }

    constructor(address _mainAdmin) {
        mainAdmin = _mainAdmin;
    }

    /// @notice Create a new service request and attach a user document (e.g. JPG URI or hash)
    function createRequest(string memory _serviceType, string memory _userDoc) public {
        uint256 id = requestCount;
        ServiceRequest memory req = ServiceRequest({
            id: id,
            citizen: msg.sender,
            serviceType: _serviceType,
            status: Status.Pending,
            timestamp: block.timestamp,
            userDoc: _userDoc,
            adminDoc: "",
            verifiedTimestamp: 0
        });

        requests.push(req);
        requestCount += 1;

        emit RequestCreated(id, msg.sender, _serviceType, _userDoc);
    }

    /// @notice Register sender as an officer candidate (will be verified by main admin)
    function registerAsOfficer() public {
        require(!officers[msg.sender].registered, "Already registered");
        officers[msg.sender] = Officer({registered: true, verified: false, registeredAt: block.timestamp, verifiedAt: 0});
        officerList.push(msg.sender);
        emit OfficerRegistered(msg.sender, block.timestamp);
    }

    /// @notice Citizen can upload or replace their document for an existing request
    function uploadUserDocument(uint256 _id, string memory _userDoc) public onlyCitizen(_id) {
        requests[_id].userDoc = _userDoc;
        emit UserDocumentUploaded(_id, msg.sender, _userDoc);
    }

    /// @notice Officer verifies the request and uploads a verification document
    function verifyRequest(uint256 _id, string memory _adminDoc) public onlyOfficer {
        require(_id < requests.length, "Invalid id");
        requests[_id].adminDoc = _adminDoc;
        requests[_id].status = Status.Verified;
        requests[_id].verifiedTimestamp = block.timestamp;

        emit AdminDocumentUploaded(_id, msg.sender, _adminDoc);
        emit RequestVerified(_id, msg.sender, block.timestamp);
    }

    /// @notice Main admin can verify or reject a registered officer
    function verifyOfficer(address _officer, bool _approve) public onlyMainAdmin {
        require(officers[_officer].registered, "Officer not registered");
        officers[_officer].verified = _approve;
        if (_approve) {
            officers[_officer].verifiedAt = block.timestamp;
        } else {
            officers[_officer].verifiedAt = 0;
        }
        emit OfficerVerified(_officer, _approve, block.timestamp);
    }

    /// @notice Generic status update (keeps compatibility)
    function updateStatus(uint256 _id, Status _status) public onlyOfficer {
        require(_id < requests.length, "Invalid id");
        requests[_id].status = _status;
        emit StatusUpdated(_id, _status);
    }

    /// @notice Check if an address is a verified officer
    function isVerifiedOfficer(address _addr) public view returns (bool) {
        return officers[_addr].verified;
    }

    /// @notice Return the list of registered officers
    function getOfficerList() public view returns (address[] memory) {
        return officerList;
    }

    function getAllRequests() public view returns (ServiceRequest[] memory) {
        uint256 len = requests.length;
        ServiceRequest[] memory arr = new ServiceRequest[](len);
        for (uint256 i = 0; i < len; i++) {
            ServiceRequest storage r = requests[i];
            arr[i] = ServiceRequest({
                id: r.id,
                citizen: r.citizen,
                serviceType: r.serviceType,
                status: r.status,
                timestamp: r.timestamp,
                userDoc: r.userDoc,
                adminDoc: r.adminDoc,
                verifiedTimestamp: r.verifiedTimestamp
            });
        }
        return arr;
    }

    /// @notice Get a single request by id
    function getRequest(uint256 _id) public view returns (ServiceRequest memory) {
        require(_id < requests.length, "Invalid id");
        return requests[_id];
    }
}
