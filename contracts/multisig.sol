// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.0;

contract MultiSigWallet {
    event TransferInitiated(uint amount, address to);
    event Approvers(address[] approvers);
    mapping(address => bool) public approvers;
    uint public approversCount;

    uint public funds;

    struct Transfer {
        uint id;
        uint amount;
        address payable to;
        address initializer;
        uint approvals;
        bool sent;
    }

    mapping (uint => mapping (address => bool)) approvalsReceived;
    
    Transfer[] public transfers;

    constructor(address[] memory _approvers) {
      approversCount = _approvers.length;
        for(uint i = 0; i < _approvers.length; i++) {
            approvers[_approvers[i]] = true;
        }
    }

    modifier isAuthority() {
        bool hasAccess = false;
        require(approvers[msg.sender] == true, "You are not an authority");
        _;
    }

    function initiateTransfer(uint amount, address receiver) public  isAuthority {
      require(amount < funds, "Not enough funds");
      Transfer memory transfer = Transfer(transfers.length, amount, payable(receiver), msg.sender, 1, false);
      approvalsReceived[transfer.id][msg.sender] = true;
      transfers.push(transfer);
      emit TransferInitiated(amount, receiver);
    }

    function approveTransfer(uint id) public isAuthority {
        require(approvalsReceived[id][msg.sender] != true, "Transfer has already been approved");
        transfers[id].approvals++;
        approvalsReceived[id][msg.sender] = true;
    }

    function launchTransaction(uint id) public isAuthority {
        require(transfers[id].sent == false, "Transfer has already been sent");
        require(transfers[id].approvals == approversCount, "Not enough approvals");
        require(transfers[id].amount < funds, "Not enough funds");
        transfers[id].sent = true;
        payable(transfers[id].to).transfer(transfers[id].amount);
        funds -= transfers[id].amount;
    }

    function deposit() public payable {
        funds += msg.value;
    }
}