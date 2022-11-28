// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.0;

contract ZeroProof {
    event Transfer(address from, address to, uint amount);
    mapping(address => Approver) public approvers;
    uint public approversCount;

    struct Approver {
        uint nonce;
        uint index;
    }

    constructor(address[] memory _approvers) {
      for (uint i = 0; i < _approvers.length; i++) {
          approvers[_approvers[i]] = Approver(0, i + 1);
      }
      approversCount = _approvers.length;
    }

    uint public funds;

    modifier isAuthority() {
        bool hasAccess = false;
        require(approvers[msg.sender].index > 0, "You are not an authority");
        _;
    }

    function deposit() public payable {
        funds += msg.value;
    }

    function getTransferTransaction(address to, address initiator, uint256 amount) public view returns (bytes32) {
        require(funds >= amount, "Insufficient funds");
        uint nonce = approvers[initiator].nonce;
        return prefixed(keccak256(abi.encodePacked("transferTo(address,uint)", to, initiator, amount, address(this), nonce)));
    }

    function transferFromContract(address to, uint amount, bytes[] memory signatures) public isAuthority {
        require(signatures.length == approversCount - 1, "Not enough signatures");
        bool[] memory usedSignatures = new bool[](approversCount);
        usedSignatures[approvers[msg.sender].index - 1] = true;
        for (uint i = 0; i < signatures.length; i++) {
            address recovered = recoverSigner(getTransferTransaction(to, msg.sender, amount), signatures[i]);
            Approver memory currentApprover = approvers[recovered];
            require(currentApprover.index > 0, "Invalid signature");
            require(usedSignatures[currentApprover.index -1] == false, "Signature already used");
            usedSignatures[currentApprover.index - 1] = true;
        }
        transferTo(to, amount);
        approvers[msg.sender].nonce += 1;   
        emit Transfer(address(msg.sender), to, amount);
    }


    function transferTo(address to, uint amount) private {
       payable(to).transfer(amount);
    }

    function prefixed(bytes32 hash) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", hash));
    }
    
    function recoverSigner(bytes32 _ethSignedMessageHash, bytes memory _signature)
        public
        pure
        returns (address)
    {
        (bytes32 r, bytes32 s, uint8 v) = splitSignature(_signature);

        return ecrecover(_ethSignedMessageHash, v, r, s);
    }

     function splitSignature(bytes memory sig)
        public
        pure
        returns (
            bytes32 r,
            bytes32 s,
            uint8 v
        )
    {
        require(sig.length == 65, "invalid signature length");

        assembly {

            r := mload(add(sig, 32))
            s := mload(add(sig, 64))
            v := byte(0, mload(add(sig, 96)))
        }

      return (r, s, v);
    }
}