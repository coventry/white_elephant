pragma solidity 0.5.1;

import "./WhiteElephant.sol";

contract WhiteElephantTestHelper is WhiteElephant {
  constructor(address _link, bytes32 _salt, bytes32 _requiredHash) 
    WhiteElephant(_link, _salt, _requiredHash) public {}
  function concat_(string memory _answer) public view returns (string memory) {
    return super.concat(_answer);
  }
  function hash_(string memory _answer) public view returns (bytes32) {
    return super.hash(_answer);
  }
}
