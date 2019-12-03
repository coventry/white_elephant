pragma solidity 0.5.1;

import "./LinkTokenInterface.sol";

contract WhiteElephant {

  address owner;
  LinkTokenInterface LINK;
  bytes32 private requiredHash;
  bytes32 private salt;
  bool collected;

  // guessAnswer withdraws the prize to _dest if _answer hashes correctly
  function guessAnswer(
    string memory _answer,
    address payable _dest
  ) public returns (bool success)
  {
    require(hash(_answer) == requiredHash, "wrong answer; try again");
    return LINK.transfer(_dest, LINK.balanceOf(address(this))); // success!
  }

  // ownerWithdraw removes all funds to an address specified by contract owner.
  function ownerWithdraw(address payable _dest) external {
    require(msg.sender == owner, "only owner can withdraw");
    require(block.timestamp > 1577836799, "cannot withdraw until 2020");
    LINK.transfer(_dest, LINK.balanceOf(address(this)));
    _dest.transfer(address(this).balance);
  }

  function concat(string memory _answer) internal view returns (string memory) {
    return string(abi.encodePacked(salt, _answer));
  }

  function hash(string memory _answer) internal view returns (bytes32) {
    return keccak256(bytes(concat(_answer)));
  }

  constructor(address _link, bytes32 _salt, bytes32 _requiredHash) public {
    owner = msg.sender;
    LINK = LinkTokenInterface(_link);
    requiredHash = _requiredHash;
    salt = _salt;
  }

  // Make contract payable, for testing
  function () external payable {}
}
